# rform

Nuxt module that ships form components (`RForm`, `RText`, `RSelect`, `RArray`, etc.) built around an injection-based composition pattern.

## Arquitetura

### Layout dos componentes

```
src/runtime/components/
  Form.vue      ← não é campo; provê a raiz da injeção. Reservado.
  Dynamic.vue   ← não é campo; renderiza um schema. Reservado.
  fields/       ← É o FieldType, por construção
  utils/        ← Label, Error, Placeholder… (RUtils*)
```

`src/runtime/utils/` continua sendo helper TS (`merger`, `vMask`, `definePreset`) — não colide, porque componente mora sob `components/`.

`fields/` **ser** o `FieldType` é o ponto: não existe mais lista de exclusão `["Form", "Dynamic"]` no `module.ts`, e o `Form.vue` deixou de declarar `Element<typeof defaults, "form">` com um `"form"` que nunca existiu no union.

### Padrão de componente

Todo componente em `components/fields/*.vue` e `components/utils/*.vue` — embutido **ou** do usuário — segue o mesmo formato:

1. **`<script lang="ts">`** — exporta `defaults` (via `defineDefaults`) e o tipo `Props`. Campo monta `Props` a partir de `Element<typeof defaults, "<tipo>">` (de `src/type.d.ts`) interseccionado com `Utils["..."]` (de `#rform/types/components/utils/props`) e props específicas; util escreve `Props` à mão e referencia `DeepPartial<typeof defaults.ui>`.
2. **`<script setup lang="ts">`** — campo chama `await useInjection(_props)` para obter `{ id, model, props }`; util chama `await useUtilProps<Props>()`. Containers (Form, Array, Object) também chamam `useProvide({ id, model })`.
3. **`defaults`** sempre define `ui` (classes Tailwind); campo também define `default` (valor inicial do model). Outros campos (`keyValue`, `keyLabel` no Select, `max` num Rating) também viram defaults mesclados via `merger`.

`Base["default"]` é **opcional** justamente para o item 1 valer nos dois: um util tem `ui` mas não tem model. Antes os utils usavam um par `defaultUi` + `defaults: Props` que não passava por `defineDefaults` — eram duas convenções, e só uma estava documentada.

### Campos e utils do usuário (`app/rform/fields|utils`)

Um `.vue` em `app/rform/fields` é um campo de **primeira classe**: entra no `FieldType` (então `useRForm`/`RDynamic` aceitam `type: "rating"`), no `components-map`, no `Components` (então `defineFieldDefaults({ Rating: … })` tipa) e pode ser alvo do `available` de um preset. `app/rform/utils` faz o mesmo para os `RUtils*`.

Mesmo nome de um embutido **substitui** o embutido inteiro — mesma precedência dos presets. Para embrulhar em vez de reescrever, o original continua alcançável pelo alias `#rform/builtin`:

```ts
import Base, { defaults as base } from "#rform/builtin/fields/Text.vue";
```

Esse alias é registrado **antes** de `#rform`: o Vite casa aliases na ordem de inserção, então o prefixo mais curto engoliria o mais longo. (No TS não importa — `paths` resolve pelo padrão mais específico.)

`Form` e `Dynamic` são nomes reservados; um `app/rform/fields/Form.vue` falha o build nomeando o arquivo.

### Escaneamento e templates gerados (`src/scan.ts`)

`collectComponents` é puro e recebe as raízes já lidas, na ordem embutido→usuário — quem vem depois vence, igual ao `collectPresets`. Desse escaneamento único saem `types/components/*`, `types/fields.d.ts`, `types/schema.d.ts`, `components-map.ts`, `registry.ts` e as raízes do vite plugin. Nome de arquivo precisa ser PascalCase alfanumérico, porque vira chave de objeto **e** membro do `FieldType`.

Os `import()` de `.vue` nos templates de tipo saem **relativos**. O `@vue/compiler-sfc` resolve import relativo com `fs` puro, e manda qualquer outra coisa para a resolução de módulos do TypeScript, que sozinha não resolve um specifier `.vue`.

### useInjection (`src/runtime/composables/useInjection.ts`)

- Lê o pai (Form) via `inject(key)`. Quando há pai e `props.name` está definido, `model.value` lê/escreve diretamente em `upper.model.value[name]` — é por isso que mutações em arrays no model do filho refletem no Form.
- Mescla `defaults` + defaults do usuário + `localProps` + `sourceProps` via `merger`.
- Carrega os defaults do componente pelo `#rform/registry` gerado (`nome → () => import(path)`). **Não** pode ser `import('../components/${name}.vue')`: o Vite compila isso num glob ancorado no arquivo da composable, e um campo em `app/rform/fields` não faz parte dele. As entradas são thunks, então o ciclo `Text.vue → useInjection → registry → Text.vue` não fecha em tempo de carga.
- `componentName` vem do `src/vite.plugin.ts`. Nome ausente ou fora do registry **lança**. Havia um fallback `"Text"` (e `"Label"` no `useUtilProps`) que renderizava o campo com os defaults de outro componente sem dizer nada.

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

### Tema: cores e radius (`src/runtime/style.css`)

Nenhum `ui` do módulo usa token semântico do Tailwind. Toda cor e todo radius passam por variável própria, em forma de arbitrary property:

```ts
container: "rounded-(--rf-radius-xl) bg-(--rf-color-background-100) has-[:focus]:outline-(--rf-color-primary)"
```

São 16 variáveis, declaradas em `src/runtime/style.css`: `--rf-color-{background,background-100,background-200,background-300,contrast,primary,primary-fg,danger,danger-fg,success,warn}` e `--rf-radius-{sm,md,lg,xl,2xl}`. Trocar tema é trocar variável — `ui` não se mexe.

O `background-200` é o único declarado sem nenhum `ui` embutido lendo: a escala é oferecida inteira ao app. Por isso ele está na lista `orphans` de `test/unit/theme.test.ts` — que também asserta o contrário, então no dia que um `ui` passar a usá-lo o teste manda tirar dali.

**Isso já foi token do playground.** Os `ui` usavam `bg-background-100`, `text-contrast/50`, `outline-primary`, que só existem no `@theme` de `playground/app/assets/css/main.css`. Instalado em qualquer outro app, todo campo renderizava transparente. A lint não pegava porque `oxlint.config.ts` aponta o `entryPoint` do `better-tailwindcss` para o CSS **do playground**.

#### A linha que o app escreve

```css
@import "tailwindcss";
@import "#rform/tailwindcss";
```

Uma linha só, e ela traz as duas coisas: o `@source` dos componentes (o Tailwind não varre `node_modules`, então sem ele nenhuma classe do módulo é emitida) e um `@import` dos tokens.

**A ordem das duas linhas afeta menos do que parece, mas afeta.** Ordem de layer é ordem de primeira aparição, então `#rform` antes deixa `rform` como a layer mais fraca, e depois como a mais forte. Só que isso só decide quem ganha quando **as duas** declaram a mesma variável. Medido no browser, com override de `--rf-color-primary`:

| forma do override no app | `#rform` antes | `#rform` depois |
|---|---|---|
| `@theme { --rf-color-primary }` | pega | **ignora** |
| `@layer base { :root { --rf-color-primary } }` | pega | **ignora** |
| `@layer rform { :root { --rf-color-primary } }` | pega | pega |
| `:root { --rf-color-primary }` (fora de layer) | pega | pega |
| `@theme { --color-primary }` (encadeia) | pega | pega |

As três de baixo são imunes à ordem, cada uma por um motivo diferente: mesma layer resolve por ordem de declaração (e o app vem depois); declaração fora de layer ganha de toda layer de autor; e `--color-primary` o módulo **nunca** declara, então não há conflito para resolver — é só o `var(--color-primary, …)` do default encontrando um valor.

Ou seja: as duas formas naturais de fato usadas — encadear pelo tema do app, ou declarar `--rf-*` dentro de `@layer rform` — funcionam nas duas ordens. Quem quebra é declarar `--rf-*` **fora** da `@layer rform`, e aí quebra calado. `#rform` antes faz as cinco funcionarem, e por isso é a recomendação; o playground usa depois, com o override em `@layer rform` (`playground/app/assets/css/main.css:99`).

É **template** gerado pelo `module.ts`, não um `.css` do `dist`, e o `@source` sai com caminho **absoluto**. Um `@source` relativo dentro de um arquivo publicado só funcionaria com o pacote instalado em `node_modules` — e o playground carrega o módulo por caminho relativo (`"../src/module"`), sem `rform` nas dependências e sem `node_modules/rform`. Com o template, a mesma linha vale para pacote instalado, link de workspace e caminho relativo.

Tem de ser `@import` do entry do app, nunca `nuxt.options.css`: num arquivo que o Tailwind não trata como parte de um entry, `@source` é ignorado e a at-rule **vaza crua** para o browser. Já foi `nuxt.options.css.unshift(style.css)` + um segundo arquivo só com o `@source`; virou um arquivo só a pedido.

Três nomes que não resolvem, todos testados: `#rform` puro (o alias aponta para um diretório e o resolver de CSS do Vite não pega `index.css` dele), `#rform/tailwindcss` pela regra geral `#rform/*` (sem extensão o Vite não acha o arquivo) e qualquer `@source` relativo. O nome sem extensão funciona por um **alias exato** `#rform/tailwindcss` → `<buildDir>/rform/tailwind.css`, registrado **antes** de `#rform/*`, que senão engole o caminho.

Consequência de ter saído do `nuxt.options.css`: um app **sem Tailwind** não recebe mais token nenhum — nada mais os injeta. Para esse caso o `package.json` exporta `rform/style.css`, que dá para pôr no `css:` na mão.

#### Invariantes do `style.css`

- **`@layer rform`, e a declaração `@layer rform;` antes de qualquer bloco.** Declaração de autor fora de layer ganha de *toda* layer de autor, antes de especificidade entrar na conta — um `:root` solto aqui inverteria o override inteiro, calado, e nas duas ordens de import. A layer nomeada também é o que dá ao app o alvo imune à ordem da tabela acima.
- **Tokens e resets, todos ancorados em `.RField`.** Os quatro resets que nenhum `ui` expressa (spinner do `number`, o truque `transition: … 600000s` do autofill, `[data-autocompleted]`, o hide do placeholder sob `:-webkit-autofill`) moram aqui, no fim do arquivo. **Já moraram no `<style>` do `Form.vue`, ancorados em `.RForm`** — e ali perdiam todo campo usado sem `RForm` em volta, calado, porque nem a classe existia no DOM nem o `<style>` do SFC chegava a ser injetado. Um `<style>` de SFC também não passa pelo `postcss-nested` (o default do Nuxt tem só `autoprefixer` e `cssnano`), então tinha de ser escrito achatado; aqui o mkdist achata.
- **Nenhuma at-rule do Tailwind.** Agora que o arquivo é `@import`ado do entry, `@theme` e `@apply` ali **seriam** processados — e é o que não se quer: um `@theme` do módulo despejaria variáveis e utilitários no namespace do design system do app (`--color-foo` viraria `bg-foo` lá). Só `@layer`/`@media`/`@supports`.

Os defaults **encadeiam** no tema do app (`--rf-color-primary: var(--color-primary, #005BDF)`), então um app que já tem `primary` no `@theme` adota sozinho — é por isso que o playground não precisou de uma linha de override. Os degraus `-100`/`-200`/`-300` (10%/15%/20%) são derivados com `color-mix` em vez de encadeados: `--color-background-100` de outro app pode significar "tom mais claro" em vez de "10% na direção do contraste". Os três batem, medidos no browser, com o degrau de mesmo nome do playground — nos dois esquemas.

Fica literal de propósito: `*-current/*` (já é `currentColor`), `bg-transparent`, `outline-transparent`, `rounded-{full,none,l-none,r-none}` (estruturais), o `bg-[linear-gradient(…#f00…)]` do matiz em `fields/Color.vue`, e o `border-white` dos marcadores do color picker — branco **por desenho**, para contrastar com uma cor arbitrária. Note a assimetria: `text-white` é drift (virou `-fg`), `border-white` não é.

**`test/unit/theme.test.ts` é a guarda, e cobre o modo de falha novo.** `bg-(--rf-color-primry)` (typo) compila, passa na lint e renderiza `var(--undefined)` → transparente, calado em todo ambiente inclusive nos testes — pior que o `bg-primry` de antes, que ao menos não emitia regra. Os cinco casos: (a) nenhum token semântico cru voltou, (b) o conjunto de `--rf-*` usado nos componentes é **igual** ao declarado, nos dois sentidos, (c) o template tem exatamente um `@source` absoluto apontando para um diretório que de fato contém `fields/`, `utils/` e `Form.vue`, mais o `@import` dos tokens, (d) todo token mora dentro de `@layer rform`, (e) o `style.css` não tem at-rule do Tailwind. O (a) tokeniza o arquivo inteiro por whitespace e tira a pontuação das pontas — sem isso a última classe de cada literal chega como `text-white",` e escapa de todo padrão ancorado em `$`.

`src/runtime/style.css` mora em `src/runtime/` porque o `@nuxt/module-builder` só constrói `src/module` e `src/runtime/` — um `.css` na raiz de `src/` nunca chega ao `dist`. O mkdist passa cssnano nele, então o arquivo publicado sai minificado (`@layer` sobrevive).

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

- `C` é o field type ("text", "color", ...) e filtra quais presets o `rule` aceita, via `available` de cada um. Todo **campo** passa o seu: `Element<typeof defaults, "text">`. `Form` não passa `C`, porque não é campo e não tem membro no `FieldType`. Os que sobrescrevem o model (`File`, `Hour`, `Number`) passam `D` como terceiro parâmetro.
- Tipa `modelValue`/`default` baseado em `OBJ["default"]` via `ConvertNeverToUnknown`.
- Atenção: se `defaults.default = null`, então `modelValue?: null` — props com valores diferentes precisam sobrescrever via `Omit<Element<...>, "modelValue" | "default"> & { modelValue?: unknown; default?: unknown }`.

## Gotchas

### `#rform/utils` é o barrel público

O template de `utils.ts` emite `import X from "<path>"` (default, virando `export { X }`) **e** `export * from "<path>"` para cada arquivo de `src/runtime/utils`. É o `export *` que faz `import { defineRule } from "#rform/utils"` funcionar.

Os specifiers do `export *` passam por `specifier()` e saem **sem extensão**. Com `.ts` no caminho, o TS precisa de `allowImportingTsExtensions` e um app consumidor normalmente não liga — o sintoma é `TS2614: Module '#rform/utils' has no exported member 'defineRule'`, como se o barrel não exportasse nada nomeado.

### O preview do autofill é invisível para o JS

Passar o mouse sobre uma sugestão do preenchedor do browser pinta o valor no `input` **sem** disparar `input`/`change` — o `model` continua vazio, então o `RUtilsPlaceholder` fica em `notFilled` (atrás do campo, `-z-10`) e os dois textos se sobrepõem. Não há evento para escutar; quem enxerga esse estado é só o CSS, via `:-webkit-autofill` (que casa preview **e** valor comitado — Chrome, Safari e Firefox 86+; `:-internal-autofill-previewed`, que separaria os dois, é restrito à UA stylesheet e não parseia em folha de autor).

Daí o par: o `Placeholder.vue` emite `data-floating` quando virou label flutuante, e o `style.css` faz `.RField :has(:-webkit-autofill) > .RUtilsPlaceholder:not([data-floating]) { opacity: 0 }`. O `>` é o que limita ao placeholder cujo pai contém o input — sem ele o `:has()` casaria todo ancestral dentro do campo. O `:not([data-floating])` preserva o caso sem `label`, em que depois do autofill comitado é o próprio placeholder que rotula o valor lá em cima.

**Ancorar em `.RForm` não serve, e é o motivo de as classes-gancho existirem.** O autofill não depende de `<form>`: o Chrome agrupa campos soltos ("unowned form fields") por heurística de DOM desde a v91, e `useInjection` faz `inject(key, undefined)` — campo sem `RForm` pai é caso suportado.

Nenhuma utility do Tailwind declara `opacity: 1` no estado base, então a regra vence independentemente da ordem de layer — não precisa de `!important` como o `[data-autocompleted]`.

### `transition-[a_b]` com duas propriedades é silenciosamente `all`

`transition-[translate_position]` vira `transition-property: translate position` — sem vírgula, é sintaxe inválida, a declaração é descartada e a propriedade volta ao inicial `all`. Com o `duration-300` ao lado, **tudo** passa a animar, `opacity` incluída: o `disable` (`opacity-0`) do placeholder ganhava um fade de 300ms ao sumir e voltar. Vírgula é o separador (`transition-[translate,top,left]`); `_` só serve para espaço *dentro* de um valor.

Compila, passa na lint e não emite aviso nenhum. Para conferir o que o Tailwind de fato emitiu: `compile("@tailwind utilities;", { base }).build([classe])` da API de `tailwindcss`.

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

### `addComponentsDir` não aninha

O scanner do Nuxt guarda cada diretório já varrido e pula todo arquivo sob ele (`if (scannedPaths.some(d => filePath.startsWith(d))) continue`). Registrar `components/` deixaria `components/fields` e `components/utils` **vazios**, sem erro nenhum — some a tag, não o build. Por isso `Form` e `Dynamic` entram por `addComponent`, um a um, e só `fields/` e `utils/` (mais as duas raízes do usuário, com `priority: 10`) entram como diretório.

`addComponent` também **não normaliza** o `filePath`, ao contrário do `addComponentsDir`. Com `\` do Windows o caminho vira import com escapes (`"C:UsersyandProjetos…"`) e o teste falha na coleta, não na asserção. `filePath()` no `module.ts` já devolve com `/`.

### O vite plugin roda antes do `@vitejs/plugin-vue`

Com `enforce: "pre"` o plugin vê o SFC cru; sem ele, o id `.vue` já foi compilado para um `import` de `?vue&type=script&setup=true`, a chamada da composable está nesse sub-request, e reescrever o que sobrou não muda nada. Rodando depois, a injeção de nome **não funcionava em build de produção** — e ninguém via, porque o fallback `"Text"`/`"Label"` cobria calado.

A consequência é que a regex passa a ver TypeScript cru: `useUtilProps<Props>()`, com o genérico entre o nome e o `(`. As regexes aceitam e **preservam** a lista de tipos.

### As classes-gancho (`RField` / `RUtil`) entram pelo `ui`

Todo campo e todo util — embutido **e** do usuário — carrega duas classes na raiz:

| raiz | genérica | específica |
|---|---|---|
| `fields/`, `app/rform/fields` | `RField` | `R<Nome>` — `RField RText` |
| `utils/`, `app/rform/utils` | `RUtil` | `RUtils<Nome>` — `RUtil RUtilsPlaceholder` |

A específica espelha a tag que o app escreve (`<RText>` → `.RText`), porque os prefixos são os mesmos que o `addComponentsDir` registra. É isso que dá ao `style.css` um alvo, sem que campo nenhum precise repetir a classe e **sem depender de `RForm` no ancestral**.

Quem escreve é `hookUi` (`src/runtime/utils/hookUi.ts`), chamado por `useInjection` e por `useUtilProps` **depois** do `merger`, sobre a **entrada mais alta** do `ui`: `container` num campo, `default` no `Placeholder`, o próprio `ui` onde ele é string. Não é o primeiro par qualquer — é a primeira entrada que guarda classes em vez de um grupo aninhado, porque o `RUtilsLoading` abre num `<Transition>` cujo `ui.transition` são nomes de transição, não classe. Componente sem nenhuma entrada de classe (`RUtilsDropdown` é `<slot>` + `<Transition>`) fica sem gancho, e não tem reset a perder.

**Depois do merge, e não dentro do `defaults`.** `ui` é sobrescrevível por contrato e o `mergerUI` lê `null` como "zera esta chave": um gancho declarado nos defaults iria embora junto com um `ui: { container: null }`, e um `container` apenas reescrito ficaria à mercê do que o `twMerge` decide descartar num namespace que não é do Tailwind — medido, `{container:"RField flex grow"} + {container:"RFieldset grid"}` dá `"RField grow RFieldset grid"`. Prependendo depois, nenhum dos dois toca no gancho. Ordem de chave sobrevive ao merge: o `merger` semeia o resultado a partir do `defaults` do componente e o `mergerUI` copia com spread.

O par nome→classe é **gerado**, em `#rform/registry` (`hooks.fields` / `hooks.utils`), ao lado do registry de módulos — é ali que o `module.ts` ainda distingue as três listas. Containers ficam de fora, então `Form` (que escreve o próprio `RForm`) e `Dynamic` não recebem gancho **sem** a composable precisar de uma lista de exclusão.

**Isso já morou no `src/vite.plugin.ts`**, que parseava o SFC com `vue/compiler-sfc` e injetava um `class` estático na raiz do `<template>`. Funcionava, inclusive com `ui.container` zerado — o Vue compila o `class` estático e o `:class` como canais independentes de um `normalizeClass`. Mas custava um parse de SFC por arquivo e punha um `import` de `vue/compiler-sfc` no bundle rollup do `dist/module.mjs`: import fora de `dependencies`/`peerDependencies` vira "Potential implicit dependencies", e com o `failOnWarn` do `@nuxt/module-builder` isso é **exit 1 no `prepack`** — resolvível só com um `build.config.ts` declarando `externals`. O plugin voltou a fazer só a injeção de nome, e o `build.config.ts` deixou de existir.

`test/unit/hookUi.test.ts` cobre a função pura (o `container: null`, o `ui` só de grupos, o não-mutar o objeto recebido) e `test/nuxt/hookClasses.test.ts` monta os componentes: campo embutido, util, campo do usuário, `ui.container` zerado e reescrito, campo sem `RForm` em volta, e o `Form` que continua sem `RField`.
### Um app consumidor precisa do próprio `tsconfig.json`

`ts.findConfigFile` sobe a partir do arquivo. Um app Nuxt sem tsconfig na raiz acaba achando o tsconfig de um projeto acima — e o `@vue/compiler-sfc` resolve `#rform/types/...` contra os tipos gerados **daquele** projeto. O sintoma é mudo e específico: as props que um util contribui simplesmente não são declaradas, e `<RRating hint="…">` cai como atributo de fallthrough em vez de prop, sem erro de compilação. Foi por isso que `test/fixtures/basic/tsconfig.json` teve que existir.

### vue-tsc precisa de `.nuxt`

`tsconfig.json` só referencia `.nuxt/tsconfig.*.json`. Sem rodar `nuxi prepare` (ou o `dev`) primeiro, `vue-tsc -p .nuxt/tsconfig.app.json --noEmit` falha.

São **três** apps Nuxt, cada um com o próprio `.nuxt` e o próprio `#rform` — checar um não cobre o outro, e é por isso que o `test:types` roda os três:

```
vue-tsc -p tsconfig.check.json                        # o módulo
vue-tsc -p playground/.nuxt/tsconfig.app.json         # o playground
vue-tsc -p test/fixtures/basic/.nuxt/tsconfig.app.json # a fixture (campos/utils de usuário)
```

## Convenções de código (oxfmt.config.ts)

- 4 espaços, aspas duplas, semicolons, `trailingComma: "none"`, `singleAttributePerLine: true`, `vueIndentScriptAndStyle: true`.
- Sem `insertFinalNewline`.

## Comandos úteis

O gerenciador de pacotes é o **pnpm** (`pnpm-lock.yaml`, só na raiz). O runtime continua sendo o Node — `pnpm run` só orquestra; vitest, vue-tsc, nuxi e unbuild rodam em Node como sempre.

- `pnpm install` — instala **os dois** projetos de uma vez (ver workspace abaixo).
- `pnpm --filter rform-playground dev` (ou `cd playground && pnpm dev`) — sobe o playground na porta 3000 com o módulo em watch.
- `pnpm exec oxlint <arquivo>` — lint (config em `oxlint.config.ts`, plugin tailwind ativo).
- `pnpm test:types` — type-check dos três apps (precisa dos três `.nuxt` populados).
- `pnpm exec nuxi prepare test/fixtures/basic` — regenera os tipos da fixture depois de mexer no `module.ts` ou em `test/fixtures/basic/rform/`.

### O `pnpm-workspace.yaml` não é opcional

No pnpm 11 o campo `pnpm` do `package.json` **não é mais lido** (ele avisa e ignora), e `pnpm-workspace.yaml` é a casa de toda configuração. Só que criar esse arquivo torna o repo um workspace root — e aí `pnpm install` dentro de `playground/` para de instalar o playground: ele resolve para a raiz e responde "Already up to date" sem criar `playground/node_modules`, em 30ms e com exit 0. **Falha em silêncio.**

Por isso o `playground` está em `packages:`. Um `pnpm install` na raiz cobre os dois, há um lockfile só, e o `postinstall` (`nuxi prepare`) do playground roda junto.

`allowBuilds` no mesmo arquivo é o outro requisito, e a entrada é **obrigatória mesmo dizendo `false`**: o pnpm bloqueia build script de dependência por padrão e, num install do zero, **sai com código 1** (`ERR_PNPM_IGNORED_BUILDS`) até haver uma decisão explícita — apagar a entrada faz ele reescrever o arquivo com `esbuild: set this to true or false`. (Com `node_modules` já populado ele nem checa, então o erro só aparece em clone novo ou CI.) Escrever `onlyBuiltDependencies` não resolve no 11.

Aqui está `false`: o binário do esbuild chega pronto pelo optional dep de plataforma (`@esbuild/win32-x64` e irmãos, que estão no lockfile), e o postinstall dele não faz falta. Medido com `node_modules` apagado: install exit 0, suíte 29/297, e o `nuxi build` do playground completo (client + SSR + Nitro).

### As três deps que o pnpm revelou

`@vitejs/plugin-vue` (no `vitest.config.ts`), `vue` e `vite` (em `src/`) eram importados **sem estar no `package.json`**. npm e bun achavam por hoisting acidental; o layout estrito do pnpm não acha. Sim, o Nuxt traz os três — mas traz para *dentro* de `.pnpm/nuxt@…/node_modules`, e nada disso é alcançável da raiz do repo.

Removê-los para conferir dá o tamanho do estrago: 3 arquivos de teste caem com `Cannot find package 'vue' imported from src/runtime/components/utils/Calendar.vue` (254 testes em vez de 297) e o `vue-tsc` despeja ~60 erros `Cannot find module 'vue'`/`'vite'`. Estão em `devDependencies`, não em `peerDependencies`, porque quem consome o módulo recebe tudo via Nuxt e mexer ali mudaria o contrato do pacote publicado.

Isso era bug latente, não invenção do pnpm: um `npm ci` com hoisting diferente quebraria igual.

**`nitropack` não entra na lista.** Ele aparece se você fizer `grep nitropack src/ test/`, mas todas as ocorrências estão em `.nuxt` **gerado** da fixture — o `src/` não importa nitropack em lugar nenhum, e os tsconfig gerados já mapeiam o caminho em `paths`. Grep para achar phantom dep precisa excluir `.nuxt/`, senão você declara dependência que ninguém usa.

### `pnpm publish` checa o git

Publica no npm normalmente (`📦 rform@0.0.0 → https://registry.npmjs.org/`), mas antes roda checagens que npm e bun não têm: **árvore limpa** (`ERR_PNPM_GIT_UNCLEAN`) e **branch** (default `main`/`master` — este repo desenvolve em `develop`). Na cadeia do `release` o `changelogen --release` commita e taggeia antes, então a árvore chega limpa; a branch é que pode barrar. `--no-git-checks` desliga, ou `publishBranch` no `pnpm-workspace.yaml` ajusta.

O `prepack` roda **duas vezes** no `release`: uma explícita na cadeia, outra pelo lifecycle do `pnpm publish`. É desperdício de segundos, não erro — e o segundo serve de guarda de que o `dist` bate com o fonte.

## Playground

`playground/app/pages/form.vue` é o smoke test visual de todos os componentes. Cenários do `RSelect` cobrem: array primitivo, multi+modelFull, single+modelFull com slot custom, e objeto `{key: label}`. Útil para validar mudanças que afetem inferência de tipos do slot.

`playground/app/pages/customizados.vue` cobre campo e util do usuário, com `playground/app/rform/fields/Rating.vue` e `playground/app/rform/utils/Hint.vue`. São eles que dão cobertura de type-check a um componente escrito **como usuário** — o `src/` não exercita esse caminho.

A fixture (`test/fixtures/basic/rform/`) tem os três casos que os testes cobrem: `fields/Rating.vue` (campo novo), `fields/Switch.vue` (substitui um embutido via `#rform/builtin`) e `utils/Hint.vue` (util novo).
