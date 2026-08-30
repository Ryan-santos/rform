# rform

Nuxt module that ships form components (`RForm`, `RText`, `RSelect`, `RArray`, etc.) built around an injection-based composition pattern.

## Arquitetura

### Padrão de componente

Todo componente em `src/runtime/components/*.vue` segue o mesmo formato:

1. **`<script lang="ts">`** — exporta `defaults` (via `defineDefaults`) e o tipo `Props`. O `Props` é montado a partir de `Element<typeof defaults>` (de `src/type.d.ts`) interseccionado com `Utils["..."]` (de `#rform/types/components/utils/props`) e props específicas.
2. **`<script setup lang="ts">`** — chama `await useInjection(_props)` para obter `{ id, model, props }`. Componentes container (Form, Array, Object) também chamam `useProvide({ id, model })`.
3. **`defaults`** sempre define `ui` (classes Tailwind) + `default` (valor inicial do model). Outros campos (`keyValue`, `keyLabel` no Select) também viram defaults mesclados via `merger`.

### useInjection (`src/runtime/composables/useInjection.ts`)

- Lê o pai (Form) via `inject(key)`. Quando há pai e `props.name` está definido, `model.value` lê/escreve diretamente em `upper.model.value[name]` — é por isso que mutações em arrays no model do filho refletem no Form.
- Mescla `defaults` + defaults do usuário + `localProps` + `sourceProps` via `merger`.
- Carrega defaults dinamicamente via `import('../components/${componentName}.vue')` no final. O `componentName` é injetado pelo `src/vite.plugin.ts` em tempo de build.

### Defaults do usuário (`app/rform/defaults.ts`)

Arquivo único, opcional, chaveado por nome de componente — é o que sobrepõe o `defaults` que cada componente declara:

```ts
import { defineFieldDefaults } from "#rform/utils";

export default defineFieldDefaults({
    Text: { default: "", ui: { container: "gap-2" } },
    Utils: { Placeholder: { ui: { default: "text-xs" } } }
});
```

Entra no `merger` entre o `defaults` do componente e as props do call site, então **prop no campo sempre ganha**. `useInjection` lê `userDefaults[componentName]`; `useUtilProps` lê `userDefaults.Utils?.[componentName]`.

`src/module.ts` gera `#rform/defaults.ts`: reexporta o arquivo do usuário quando ele existe, senão emite `const defaults = {}`. Nos dois casos o template existe, então as composables importam sem guarda. O `builder:watch` cobre o caminho `<srcDir>/rform/defaults` (sem extensão, pra pegar `.ts` e `.js`), pra criar o arquivo depois regenerar o template.

**Isso já morou no `app.config.ts`** (`rform.components.*`, via augment de `nuxt/schema`). Não mora mais — o augment e o template `types/app-config.d.ts` foram removidos, e nada em `src/` importa `#app`.

O nome `defineFieldDefaults` está hardcoded em dois lugares fora do código: o selector de callee do `better-tailwindcss` em `oxlint.config.ts` e o `tailwindCSS.experimental.classRegex` em `.vscode/settings.json`. Renomear o helper sem mexer nos dois faz lint de classe e IntelliSense **pararem calados** dentro do `defaults.ts`. O `path` do matcher é `(^|\.)ui(\.|$)` — ancorado por segmento, então pega `ui.container`, `Text.ui.label.required` e `Utils.Placeholder.ui.default`, e deixa `Text.default` (que não é classe) de fora.

### Presets (rules e masks)

Um arquivo = um preset. O nome vem do caminho relativo em camelCase (`br/insc-est.ts` → `brInscEst`).

- **Embutidos:** `src/runtime/presets/{rules,masks}/**/*.ts`. Tudo que é do Brasil mora em `br/`, dos dois lados: rules `brCpf`, `brCnpj`, `brCep`, `brTelefone`; masks `brCpf`, `brCnpj`, `brCep`, `brTelefone`, `brCelular`, `brCpfCnpj`, `brPlaca`, `brData`. Genéricos ficam na raiz: `required`, `min`, `max`, `email`, `url` — hoje não há mask genérica.
- **Do usuário:** `app/rform/presets/{rules,masks}/**/*.ts` (recursivo). Mesmo nome sobrescreve o embutido.
- Cada arquivo faz `export default defineRule({ available?, validation })` ou `defineMask({...})`, **importados explicitamente de `#rform/utils`** — os helpers não estão no auto-import. O `const` type parameter em `defineRule` é o que preserva `available: ["text"]` como tupla literal — sem ele o filtro por componente para de funcionar.
- `available` é `readonly FieldType[]`, então `["txt"]` falha na definição com "Did you mean `"text"`?" em vez de nunca casar com componente nenhum.

`src/module.ts` escaneia as duas raízes e gera:

- `#rform/presets.ts` — imports estáticos + objetos `rules`/`masks`;
- `#rform/types/presets.d.ts` — `typeof import(...)` por arquivo. **O build nunca executa os arquivos**, o TS resolve.
- `#rform/types/fields.d.ts` — só o union `FieldType` (`"text" | "select" | ...`), um membro por componente fora `Form`/`Dynamic`.

`fields.d.ts` é gerado **sem nenhum import de propósito**. Tirar `FieldType` de `FieldConfig["type"]` fecharia um ciclo: `definePreset` → `schema.d.ts` → `components.d.ts` → `Element` → `Rule` de `presets.d.ts` → `typeof import(<preset>)` → `defineRule` → `definePreset`. `schema.d.ts` só reexporta o union.

Dois caminhos que colapsam no mesmo nome (`br/cpf.ts` + `brCpf.ts`) fazem os dois templates falharem, com `ERROR [rform] duplicate preset name` nomeando os dois arquivos. O Nuxt rebaixa falha de template a warning, então o `prepare` ainda sai com 0 — o sintoma é `#rform/presets` sumir, não o build parar.

Resolução em runtime é ponto único: `resolveRule` / `resolveMask` (`src/runtime/utils/`), chamados por `useInjection`. `rule` aceita nome, `{ name, ...args }`, função, `ZodType` ou array; `mask` procura o preset primeiro e cai pra pattern maska cru. O `form` das validations vem de `defineFormRoot` (`composables/formRoot.ts`), provido **só** pelo Form — Array/Object não sobrescrevem, então campo aninhado enxerga o form inteiro.

#### Um objeto só: `{ value, form, ...args }`

Toda validação — `validation` de preset **e** função inline no `rule` — recebe um único objeto. Quem tipa é `RuleContext` (`utils/definePreset.ts`, exportado por `#rform/utils`): `value` e `form` já vêm, o parâmetro é só o que o preset **acrescenta**.

```ts
import { defineRule, type RuleContext } from "#rform/utils";

defineRule({ validation: ({ value, form, uf }: RuleContext<{ uf: string }>) => … });
```

`RuleContext` também **estreita**: `RuleContext<{ value: string, uf: string }>` tipa `value` como string, porque `unknown & string` é `string`. Sem parâmetro (`RuleContext`) o preset não tem args e é referenciado só pelo nome.

Os args são **nomeados no próprio ref**, não posicionais: `{ name: "min", min: 3 }`, `{ name: "brInscEst", uf: "SP" }`. O tipo sai de `Omit<P, keyof BaseContext>` sobre o parâmetro da `validation` (em `types/presets.d.ts`), então:

- preset sem args → aceita `"min"` e `{ name: "min" }`;
- preset com arg obrigatório → **só** `{ name, ...args }`, e faltar/errar o tipo do arg é erro de compilação;
- `args: [3]` (a forma antiga) agora falha com `'args' does not exist`.

`fromPreset` monta o contexto como `{ ...args, value, form }` — nessa ordem de propósito, para um arg chamado `value` ou `form` não conseguir sombrear o que o campo realmente tem.

#### As rules embutidas são zod

Cada uma monta um `ZodType` e passa por `check(schema, value)` (`presets/helpers.ts`), que devolve `issues[0].message`. É isso que torna a mensagem do preset a mensagem do campo. Consequência de empacotamento: `#rform/presets.ts` importa **todos** os presets estaticamente, e todo campo importa `#rform/presets` — então **zod deixou de ser peer dependency opcional**, é obrigatória.

As format rules (`email`, `url`, `br/*`) saem cedo em `isBlank(value)` para `required` continuar dono sozinho da vacuidade. `min`/`max` escolhem o schema pelo **valor** (`z.number()` / `z.array()` / `z.string()`), não pelo tipo do campo.

Preset em `useRForm(schema)` passa intacto por `normalizeSchema` (quem resolve é o campo) e vira `z.any().superRefine(async ...)` no `rules` agregado — **schema com preset exige `safeParseAsync`**; schema só-Zod continua síncrono.

### `Element<OBJ, C, D>` (`src/type.d.ts`)

- `C` é o field type ("text", "color", ...) e filtra quais presets o `rule` aceita, via `available` de cada um. Todo componente passa o seu: `Element<typeof defaults, "text">`. Os que sobrescrevem o model (`File`, `Hour`, `Number`) passam `D` como terceiro parâmetro.
- Tipa `modelValue`/`default` baseado em `OBJ["default"]` via `ConvertNeverToUnknown`.
- Atenção: se `defaults.default = null`, então `modelValue?: null` — props com valores diferentes precisam sobrescrever via `Omit<Element<...>, "modelValue" | "default"> & { modelValue?: unknown; default?: unknown }`.

## Gotchas

### `#rform/utils` é o barrel público

O template de `utils.ts` emite `import X from "<path>"` (default, virando `export { X }`) **e** `export * from "<path>"` para cada arquivo de `src/runtime/utils`. É o `export *` que faz `import { defineRule } from "#rform/utils"` funcionar.

Os specifiers do `export *` passam por `specifier()` e saem **sem extensão**. Com `.ts` no caminho, o TS precisa de `allowImportingTsExtensions` e um app consumidor normalmente não liga — o sintoma é `TS2614: Module '#rform/utils' has no exported member 'defineRule'`, como se o barrel não exportasse nada nomeado.

### `v-mask` é nosso, não o `v-maska`

Os cinco componentes com máscara — `Text`, `Textarea`, `Date`, `Hour` e `Utils/Calendar` — usam `vMask` (`src/runtime/utils/vMask.ts`), não a diretiva do maska. Nenhum lugar do `src/` importa `maska/vue`. Motivo: `maska/vue` faz

```js
const a = e instanceof HTMLInputElement ? e : e.querySelector("input");
if (a == null || a?.type === "file") return;
```

— um `<textarea>` cai fora e nunca é bindado. O `MaskInput` do maska, porém, só usa `value`, `selectionStart`, `setSelectionRange`, `addEventListener` e `dispatchEvent`, que textarea tem; só o tipo `MaskaTarget` e esse guard excluem. `vMask` instancia `MaskInput` direto no elemento (input **ou** textarea), com WeakMap por elemento e `destroy()` no `unmounted`.

O cast `el as HTMLInputElement` na construção é deliberado — `MaskaTarget` é tipado só para input, o runtime é agnóstico.

**`v-mask` liga só no elemento onde está — não procura descendente.** O maska tem o fallback `querySelector("input")`, e ele é a causa de duas classes de bug: um wrapper (ou uma diretiva que o Vue repassa para a raiz de um componente) sequestra o campo que outro binding já possui, e `mounted`/`unmounted` resolvem nós diferentes, vazando listener. Resolver para `el` ou nada mantém todos os hooks falando do mesmo elemento a vida inteira do binding. Posto em elemento que não é campo, avisa no console em vez de falhar calado.

### Props genéricos booleanos: use `T & boolean`

Vue compila `defineProps<{ multiple?: Multiple }>()` (onde `Multiple extends boolean`) com `multiple: { type: null }` em runtime. Sem `type: Boolean`, `<RSelect multiple>` chega como `""` (string vazia, falsy). **Solução:** declarar como `multiple?: Multiple & boolean` — a interseção força o compilador SFC a emitir `type: Boolean` mantendo o generic para inferência de tipos do slot.

Confirmação: olhar o bundle servido pelo dev server (`curl /_nuxt/@fs/.../Select.vue | grep "multiple:"`).

### "Union type too complex" em useInjection

Generics com conditional types nas `Props` (ex.: `Multiple extends true ? T[] : T` no slot) cascateiam complexidade quando passados para `useInjection<T extends Element>`. **Solução:** declarar um tipo `InternalProps` simples (sem generics) e castear na chamada — `await useInjection(_props as unknown as InternalProps)`. Mantém o tipo público rico sem estourar o type-checker.

Quando o slot precisa expor um tipo conditional (`Multiple extends true ? Item[] : Item`), criar helpers em script (`fieldSlot()`, `rowSlot(option)`) que retornam `as Selected` — o template não suporta cast `as` direto em expressões.

### vue-tsc precisa de `.nuxt`

`tsconfig.json` só referencia `.nuxt/tsconfig.*.json`. Sem rodar `nuxi prepare` (ou o `dev`) primeiro, `vue-tsc -p .nuxt/tsconfig.app.json --noEmit` falha. Para checagem rápida:

```
npx vue-tsc -p .nuxt/tsconfig.app.json --noEmit 2>&1 | Select-String "Select.vue"
```

## Convenções de código (oxfmt.config.ts)

- 4 espaços, aspas duplas, semicolons, `trailingComma: "none"`, `singleAttributePerLine: true`, `vueIndentScriptAndStyle: true`.
- Sem `insertFinalNewline`.

## Comandos úteis

- `cd playground && npm run dev` — sobe o playground (porta 3000) com o módulo em watch.
- `npx oxlint <arquivo>` — lint (config em `oxlint.config.ts`, plugin tailwind ativo).
- `npx vue-tsc -p .nuxt/tsconfig.app.json --noEmit` — type-check (precisa de `.nuxt` populado).

## Playground

`playground/app/pages/form.vue` é o smoke test visual de todos os componentes. Cenários do `RSelect` cobrem: array primitivo, multi+modelFull, single+modelFull com slot custom, e objeto `{key: label}`. Útil para validar mudanças que afetem inferência de tipos do slot.
