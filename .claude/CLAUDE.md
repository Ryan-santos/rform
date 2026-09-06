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

1. **`<script lang="ts">`** — exporta `defaults` (via `defineDefaults`) e o tipo `Props`. Campo monta `Props` a partir de `Element<typeof defaults, "<tipo>">` (de `src/type.d.ts`) interseccionado com `Utils["..."]` (de `#rform/types/components/utils/props`), `TextProp<typeof defaults.text>` quando há texto, e props específicas; util escreve `Props` à mão e referencia `DeepPartial<typeof defaults.ui>` (mais `TextProp<typeof defaults.text>`, no mesmo caso).
2. **`<script setup lang="ts">`** — campo chama `await useField(_props)` para obter `{ id, model, props, tr, locale }`; util chama `await useUtil<Props>()`, que devolve `{ props, upper, tr, locale }`. Containers (Form, Array, Object) também chamam `useProvide({ id, model })`.
3. **`defaults`** sempre define `ui` (classes Tailwind); campo também define `default` (valor inicial do model); quem tem texto define `text`, um **objeto aninhado** de chaves de tradução do módulo — é o marcador que autoriza o auto-prefixo `rform.<fields|utils>.<componente>.`, e a árvore mantém a forma até o template: `text: { button: "add" }` lê `tr(props.text?.button)`, nunca uma prop `buttonText` de nível superior. Outros campos (`keyValue`, `keyLabel` no Select, `max` num Rating) também viram defaults mesclados via `merger` — e ficam fora do `text` justamente porque não são texto. `label` e `placeholder` são as duas exceções: moram no topo por contrato (um app os passa direto), mas ainda são `TrInput` e ainda são prefixados quando o valor vem do próprio `defaults` do componente.

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

### useField (`src/runtime/composables/useField.ts`)

- Lê o pai (Form) via `inject(key)`. Quando há pai e `props.name` está definido, `model.value` lê/escreve diretamente em `upper.model.value[name]` — é por isso que mutações em arrays no model do filho refletem no Form.
- Mescla `defaults` + defaults do usuário + `localProps` + `sourceProps` via `merger` — depois de passar o `defaults` do componente pelo `prefixText`, que é o que dá procedência de graça ao texto (ver `defaults.text`, na seção de i18n).
- Carrega os defaults do componente pelo `#rform/registry` gerado (`nome → () => import(path)`). **Não** pode ser `import('../components/${name}.vue')`: o Vite compila isso num glob ancorado no arquivo da composable, e um campo em `app/rform/fields` não faz parte dele. As entradas são thunks, então o ciclo `Text.vue → useField → registry → Text.vue` não fecha em tempo de carga.
- `componentName` vem do `src/vite.plugin.ts`. Nome ausente ou fora do registry **lança**. Havia um fallback `"Text"` (e `"Label"` no `useUtil`) que renderizava o campo com os defaults de outro componente sem dizer nada.

### Defaults do usuário (`app/rform/defaults.ts`)

Arquivo único, opcional, chaveado por nome de componente — é o que sobrepõe o `defaults` que cada componente declara:

```ts
import { defineFieldDefaults } from "#rform/utils";

export default defineFieldDefaults({
    Text: { default: "", ui: { container: "gap-2" } },
    Utils: { Placeholder: { ui: { default: "text-xs" } } }
});
```

Entra no `merger` entre o `defaults` do componente e as props do call site, então **prop no campo sempre ganha**. `useField` lê `userDefaults[componentName]`; `useUtil` lê `userDefaults.Utils?.[componentName]`.

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

Resolução em runtime é ponto único: `resolveRule` / `resolveMask` (`src/runtime/utils/`), chamados por `useField`. `rule` aceita nome, `{ name, ...args }`, função, `ZodType` ou array; `mask` procura o preset primeiro e cai pra pattern maska cru. O `form` das validations vem de `defineFormRoot` (`composables/formRoot.ts`), provido **só** pelo Form — Array/Object não sobrescrevem, então campo aninhado enxerga o form inteiro.

#### Um objeto só: `{ value, form, ...args }`

Toda validação — `validation` de preset **e** função inline no `rule` — recebe um único objeto. Quem tipa é `RuleContext` (`utils/definePreset.ts`, exportado por `#rform/utils`): `value` e `form` já vêm, o parâmetro é só o que o preset **acrescenta**. O tradutor **não** está aí — uma rule chega ao locale ativo pelo `trRule` importado, e o contexto continua sendo só o que o campo de fato tem.

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

Cada uma é uma **fábrica sem parâmetro** — `const schema = () => z.custom(…, trRule("required"))` — e passa por `check(schema(), value)` (`presets/helpers.ts`), que devolve `issues[0].message`. É isso que torna a mensagem do preset a mensagem do campo. Fábrica, e não constante de escopo de módulo, porque `trRule` é resolvido **na construção do schema**: a mensagem tem de ser a do locale ativo, e o locale muda sem a página recarregar. Consequência de empacotamento: `#rform/presets.ts` importa **todos** os presets estaticamente, e todo campo importa `#rform/presets` — então **zod deixou de ser peer dependency opcional**, é obrigatória.

As format rules (`email`, `url`, `br/*`) saem cedo em `isBlank(value)` para `required` continuar dono sozinho da vacuidade. `min`/`max` escolhem o schema pelo **valor** (`z.number()` / `z.array()` / `z.string()`), não pelo tipo do campo.

Preset em `useRForm(schema)` passa intacto por `normalizeSchema` (quem resolve é o campo) e vira `z.any().superRefine(async ...)` no `rules` agregado — **schema com preset exige `safeParseAsync`**; schema só-Zod continua síncrono.

### i18n: `tr`, uma função e dois motores (`src/runtime/translate`, `utils/tr.ts`, `src/runtime/locales`)

Nenhum texto e nenhum formato de data cravado, e **uma** função de tradução só: `tr`. Ela é o que campo, util e rule chamam, e aceita quatro formas de entrada:

```ts
tr("form.nome")                              // chave do app
tr({ key: "form.max", params: { n: 30 } })   // chave do app, com params
tr("rform.formats.date")                     // chave do módulo, caminho por extenso
tr("~~Nome")                                 // literal explícito
```

As camadas:

- **Packs** — `src/runtime/locales/<code>.ts`, objeto aninhado com `export default`. `pt-BR` é o de referência (é o `typeof` dele que vira `Messages`) e `en.ts` é tipado *contra* ele, então uma chave nova sem tradução é erro de compilação. Sintaxe do vue-i18n: interpolação `{param}` **e** plural `a | b`, que agora rendem o mesmo nos dois motores.
- **`tr`** — `useTranslate()` (composable) devolve `{ tr, locale }` delegando a `#rform/translate`; `useField` e `useUtil` o chamam, então **todo** campo e util — inclusive os de `app/rform/{fields,utils}` — ganham `tr` sem escrever import, do mesmo jeito que já ganham `mask`. Fora de componente, `tr` e `trRule` saem de `#rform/utils`.
- **Datas** — `dateFormat(pattern)` (`utils/dateFormat.ts`, puro) deriva de `formats.date` a máscara maska, o regex de parse e a formatação de exibição, que antes eram três literais `dd/mm/yyyy` em dois arquivos. Quem lê o pattern é `tr("rform.formats.date")`.

`app/rform/locales/<code>.ts` é o pack do usuário, escaneado como os presets. **Mesmo code mescla** (via `merger`), não substitui — diferente de campo, util e preset, onde mesmo nome troca o arquivo inteiro. É o que permite um pack de três chaves continuar completo. Um code novo (`es`) simplesmente entra, e o que faltar cai no `fallbackLocale`, que é o pack default.

#### As duas rotas

O algoritmo mora **acima** do motor. `normalize` (em `utils/i18n.ts`) reduz qualquer das quatro formas a `(key, params)` — e mora ali, não ao lado do `tr`, porque os dois motores o importam e `utils/tr.ts` importa os motores: a outra direção fecharia ciclo. Daí em diante:

```
COM PONTE (translate/bridge.ts)
  1. key começa com "~~"  →  key.slice(2).trimStart()
  2. resto                →  $i18n.t(key, params, plural?)
       (o store do app já tem os packs do módulo sob `rform`, registrados pelo
        i18n:registerModule — "rform.fields.array.add" resolve sem tratamento especial)

SEM PONTE (translate/standalone.ts)
  1. key NÃO começa com "rform."  →  key, intacta
  2. resto                        →  translate(ctx, key.slice(6), params, plural?)
```

Com ponte, `tr("Nome")` — literal sem `~~`, que a tipagem já proíbe — cai no passo 2 e o vue-i18n loga *missing key* no dev. Barulhento de propósito. Sem ponte, uma chave do módulo que o pack não tem volta como a **chave inteira** (`rform.foo.bar`), e não como o caminho pelado que o intlify devolve — uma mensagem faltando continua legível como uma.

`tr` lê `locale.value` **a cada chamada**, então uma chamada dentro de template rastreia o ref e trocar de idioma re-renderiza. É o que faz `RDate` reformatar: o `watch` dele tem `[model, pattern]` como fonte, não só `model` — trocar de idioma não mexe no model (que é ISO), mas muda como ele se escreve.

O `standalone` mantém **um** `CoreContext` para o processo (compilar mensagem é a parte cara e o intlify cacheia por contexto) e troca `context.locale` a cada chamada. O contexto é casteado para `CoreContext<string>`: com o tipo literal dos packs, as sobrecargas de `translate` andam recursivamente por ele (`PickupPaths`/`PickupKeys`) e o TS desiste com *"Type instantiation is excessively deep and possibly infinite"* — e a completação de chave que elas dão não serve a este call site, que monta o caminho na mão.

#### O corte do bundle é estrutural

**Detecção:** `hasNuxtModule("@nuxtjs/i18n", nuxt)`, no topo do `setup`. Ele lê a lista **declarada** de módulos, então não depende de o rform ser registrado antes ou depois do i18n no `modules:` — ao contrário do hook, que só resolve tarde.

**Forma:** dois arquivos reais, não um template que gera código em string, para que os dois corpos passem por oxlint e `vue-tsc` como qualquer fonte. O `module.ts` registra um **alias exato** `#rform/translate` → um dos dois, **antes** de `#rform/*` — o Vite casa aliases na ordem de inserção, e o prefixo mais curto engoliria o mais longo. Mesma precedência que `#rform/tailwindcss` e `#rform/builtin` já usam.

**A exclusão é estrutural, não uma otimização de bundler que pode falhar: o corpo da ponte não escreve o import.** `test/unit/translateBridge.test.ts` lê o fonte de `bridge.ts` e asserta que a string `@intlify` não aparece — e a prova final do build é `grep -c "@intlify" dist/runtime/translate/bridge.mjs` dar `0`.

Custo medido (ESM cru, `@intlify/core` 11.4.10):

| pacote | tamanho |
|---|---|
| `@intlify/core-base` | 66.239 B |
| `@intlify/message-compiler` | 57.230 B |
| `@intlify/shared` | 13.820 B |
| **total** | **~137 kB** |

No app **sem** i18n. Zero no app com.

**Alavanca futura, fora de escopo:** a flag `__INTLIFY_DROP_MESSAGE_COMPILER__` corta os 57 kB do compilador em troca de packs pré-compilados. `#rform/locales` já é template gerado, então é viável — mas não hoje.

`@intlify/core` está em `dependencies`, não como peer opcional: o caminho sem i18n é o **comum**, e um peer opcional faria o caso padrão exigir instalação manual. (É também o que evita "Potential implicit dependencies" no `prepack`.)

#### A assimetria do `~~`

`~~` é removido **só** com ponte. Sem ela, `tr` é a identidade para tudo que não começa com `rform.` — e `~~Nome` inclui o `~~` na string devolvida, então **um componente escrito com `~~Nome` imprime `~~Nome` num app sem i18n**. Custo aceito, não bug: sem ponte não há nada contra o que resolver uma chave do app, então não há como distinguir "literal" de "chave" sem inventar uma segunda regra que só existiria para esse caso. A rigidez do `~~` só faz sentido onde ela compra alguma coisa — no app com i18n, onde a tipagem transforma todo literal solto em erro de compilação.

#### `defaults.text` é o marcador

O `defaults` de um componente guarda coisas de naturezas diferentes, e só uma é texto:

```ts
export const defaults = defineDefaults({
    ui: { … },                          // classes
    default: [],                        // valor inicial do model
    text: {
        button: "add",                  // ← chave de tradução DO MÓDULO
        bytes: { kb: "kb" }              // ← grupo: a própria chave entra no caminho
    },
    keyValue: "id"                       // nome de propriedade — NÃO é texto
});
```

`Base` reserva `ui`, `default`, `text` e as duas que moram fora dele por contrato — `label` e `placeholder`, adiante. `text` é `TextSource` (`src/type.d.ts`): um objeto aninhado, `{ [key]: string | TextSource }`, e continua aninhado o caminho inteiro — nada é achatado para o topo. Um template lê `tr(props.text?.button)`, nunca uma prop de nível superior tipo `buttonText`. Sem esse marcador a regra "prefixa toda string do `defaults`" transformaria `Select.keyValue: "id"` em `"rform.fields.select.id"`, e o Select passaria a procurar `option["rform.fields.select.id"]` — quebra calada em três lugares hoje (`Select.keyValue`, `Select.keyLabel`, `Pin.type`) e armadilha permanente para campo de usuário.

Quem prefixa é `prefixText` (`utils/prefixText.ts`, puro), chamado por `useField` (com `scope: "fields"`) e por `useUtil` (com `scope: "utils"`) sobre o `defaults` do componente, **antes** do `merger`:

```
defaults.text = { button: "add", bytes: { kb: "kb" } }
      ↓ prefixa com rform.<scope>.<componente>.
{ button: "rform.fields.array.add", bytes: { kb: "rform.fields.file.bytes.kb" } }
      ↓ merger(defaults, userDefaults, localProps, sourceProps) — recursivo, folha a folha
props.text.button / props.text.bytes.kb
```

**Um grupo carrega a própria chave para dentro do prefixo.** Sem isso o aninhamento seria forma para a prop e nada para a chave, e cada folha teria de reescrever o caminho inteiro na mão. É por isso que `text: { bytes: { kb: "kb" } }` no `File` sai como `rform.fields.file.bytes.kb`, e não `rform.fields.file.kb`.

O `scope` (`"fields"` ou `"utils"`) é o que dissolve a preocupação antiga de um campo e um util com o mesmo nome disputarem chave: `Calendar` é os dois hoje, e um vive em `rform.fields.calendar.*`, o outro em `rform.utils.calendar.*` — subárvores diferentes, sem teste nenhum precisando provar a ausência de colisão.

**Como o prefixo acontece antes do merge, e o merge é recursivo, quem sobrescreve substitui só o valor prefixado daquela folha** — a procedência sai de graça, sem rastrear nada:

```ts
<RArray :text="{ button: 'form.adicionar' }" />                    → "form.adicionar"         (cru)
defineFieldDefaults({ Array: { text: { button: "meu.add" } } })    → "meu.add"                (cru)
// nada passado                                                    → "rform.fields.array.add" (prefixado)
```

**`label` e `placeholder` são as duas exceções — sempre fora de `text`, no topo**, por contrato: um app os passa direto (`<RText label="Nome" />`), então não podem morar dentro de uma árvore que o app não escreve por inteiro. Continuam sendo `TrInput`, e `prefixText` prefixa os dois quando o valor veio dos defaults do próprio componente e não é uma string vazia — é o `placeholder: "placeholder"` do `File`, que sai como `rform.fields.file.placeholder`. A string vazia é deixada em paz: é o sentinela de "não renderiza nada", e `rform.fields.file.` sozinho nunca é uma chave a resolver por engano.

No `useUtil` o `prefixText` roda **uma vez, fora do `computed`**: ele copia, e o objeto `defaults` do componente é compartilhado por todas as instâncias.

**Isso já foi achatamento, e a colisão que ele arriscava já foi resolvida por guarda em vez de por forma.** `defaults.text` costumava virar props de nível superior — `text: { buttonText: "add" }` produzia `props.buttonText` — e `defineDefaults` recusava em tempo de tipo qualquer chave de `text` que colidisse com uma chave do topo (`NoTextCollision`), porque o achatamento a sobrescreveria calado. A armadilha real, e ela mordeu de verdade: `utils/Calendar.vue` chegou a declarar `timeLabel` em vez de `time`, porque `time` já era o booleano que decide se o relógio aparece, e uma chave achatada ali seria *truthy* para sempre — o painel de hora abriria e nunca mais fecharia. Com `text` aninhado, `props.text.time` e `props.time` são caminhos diferentes e não podem colidir; a chave voltou a ser `time`, e o guard `NoTextCollision` não existe mais — nada precisa recusar o que não pode acontecer. A lição que fica, mesmo sem o mecanismo que a forçava: não dar a uma chave de `text` o nome de uma prop que o componente testa por veracidade.

Cuidado com o nome, também: `src/runtime/presets/helpers.ts` exporta uma função `text()` (coerção para string, usada pelas rules de formato). Não colidem — helper de preset não entra no barrel `#rform/utils` — mas são coisas diferentes com o mesmo nome num repo onde as duas aparecem lado a lado.

#### O `Element` **não** deriva os props de texto — e não tem como, na forma ingênua

A forma óbvia seria `Element<OBJ> & { [K in keyof OBJ["text"]]?: TrInput }`, com `OBJ` vindo de `typeof defaults`. **Não é implementável.** Quem resolve `defineProps<Props>()` é o `@vue/compiler-sfc`, que anda o tipo na mão e não tem checker: indexar `OBJ["text"]` atrás de um `TSTypeQuery` e depois enumerar `keyof` disso para gerar props novas é pedir para resolver um mapped type sobre o índice de um genérico — e falha, derrubando a coleta de props do SFC inteiro (`@vue-ignore` "resolve" compilando, mas pior: os props type-checkam enquanto a declaração de runtime não existe, e um valor passado em `text` cai em `attrs` sem nunca chegar ao componente, calado).

A saída é `TextTree`/`TextProp` (`src/type.d.ts`), um **mapped type**, não condicional, ancorado num lugar fixo:

```ts
export type TextTree<T> = {
    [K in keyof T]?: T[K] extends string ? TrInput : TextTree<T[K]>
};

export type TextProp<T> = { text?: TextTree<T> };
```

O que o compiler-sfc aceita aqui e recusa na forma ingênua é que **a chave `text` sempre existe** — só o interior dela é mapeado sobre `T`. Um `TSConditionalType` que decide **se** a prop existe é o que ele não resolve (`"Unresolvable type: TSConditionalType"`); um mapped type que decide **o que tem dentro** de uma prop que já existe, ele resolve. Um campo escreve `TextProp<typeof defaults.text>` na interseção do próprio `Props` e para de restatar as chaves à mão: `TextProp<{ hint: string, teste: { a: string } }>` vira `{ text?: { hint?: TrInput, teste?: { a?: TrInput } } }`.

`Element` não tenta enxergar `text` de propósito — ele nem recebe `OBJ["text"]` como conceito, e não faz por onde. Cada campo intersecciona `TextProp<typeof defaults.text>` por conta própria, porque só o componente sabe a forma da própria árvore; um util, que já escreve `Props` à mão, faz o mesmo sem estranhar.

**Isso já foi resolvido diferente.** Antes de `TextTree` existir, cada campo escrevia os props de texto por extenso (`buttonText?: TrInput`) e listava as mesmas chaves em `defaults.text` — duas fontes de verdade para a mesma lista, uma delas silenciosamente esquecível. `timeLabel` no `Calendar` (acima) é do mesmo período: a chave existia tanto para nomear a mensagem quanto para não pisar na prop `time`.

#### `WithTextSource<P>`: o mesmo componente, visto do lado errado

`useUtil<Props>(defaults)` (a forma síncrona, com os próprios `defaults` do componente em mão) não pode receber `defaults` tipado como `Props`: em `Props`, `text` é `TextTree<...>` — folhas `TrInput` — mas o objeto que o componente de fato declara em `defaults.text` ainda não passou por `prefixText`, e suas folhas são só o **sufixo** cru (`"start"`, não um `TrInput` resolvido). Num app com `@nuxtjs/i18n`, `TrInput` estreita para `ModuleKey | Literal` — nenhum sufixo solto como `"start"` é `ModuleKey` nem começa com `~~` — então os dois tipos genuinamente divergem, e não é um detalhe de nomenclatura.

`WithTextSource<P>` (`src/type.d.ts`) existe para isso: `Omit<P, "text"> & { text?: TextSource }` — o mesmo `Props`, com `text` trocado de volta para a forma de autoria. `useUtil` aceita `WithTextSource<P>` e não `P` na sobrecarga síncrona precisamente porque `defaults` está do lado de cá do prefixo; quem chama `useUtil<Props>()` sem argumento (a forma assíncrona, que busca os defaults pelo registry) não precisa dele — ali quem já prefixou é o próprio `useUtil`, por dentro.

#### O plural é o **quarto** argumento

Medido contra `@intlify/core@11.4.10`, com `presets.rules.min.length` = `"Mínimo de {min} caractere. | Mínimo de {min} caracteres."`:

| chamada | resultado |
|---|---|
| `translate(ctx, path, { named: { min } })` | param chamado literalmente `named`; `{min}` sai **vazio** |
| `translate(ctx, path, { min: 5 })` | interpola, mas fica no ramo 0 → `"Mínimo de 5 caractere."` |
| `translate(ctx, path, { min: 5 }, 5)` | interpola **e** escolhe o ramo → `"Mínimo de 5 caracteres."` |

Ou seja: o terceiro argumento é o objeto de params **cru** (nada de wrapper `{ named }` / `{ plural }`), e a escolha do plural é o **quarto**. Sem ele o intlify renderiza o ramo 0 qualquer que seja a contagem, que é exatamente o bug que isto substitui (`"Mínimo de 1 caracteres."`).

Quem fecha essa lacuna é `pluralOf` (`utils/i18n.ts`), compartilhado pelos dois motores: **o primeiro valor numérico do objeto de params serve de escolha**. É o que permite a uma rule escrever `trRule({ key: "min.length", params: { min } })` sem repetir o número — a mensagem interpola e pluraliza pelo mesmo `min`. A ponte faz igual, com a sobrecarga `t(key, named, plural)` do vue-i18n, que é a mesma posição.

#### `trRule`: a rule importa o tradutor, não o recebe

Uma rule não é componente e não pode chamar composable — era por isso que `t` viajava no contexto. Um helper **importado** resolve o mesmo problema sem ocupar o canal:

```ts
import { trRule } from "#rform/utils";

trRule({ key: "min.number", params: { min } });
//  → tr({ key: "rform.presets.rules.min.number", params: { min } })
```

`#rform/utils` exporta os dois: `tr` (caminho completo, sem prefixo — para o `tr("rform.formats.date")` do `Date.vue` e para um preset de usuário que queira mensagem do **app**) e `trRule` (o açúcar que prefixa `rform.presets.rules.`).

Por tabela, nada disso existe: `resolveRule` não tem parâmetro de tradutor, `BaseContext` é `{ value, form }`, `fromPreset` não injeta nada além dos args, e `useField` não repassa tradutor nenhum para a validação. `RuleContext<T>` é `{ value, form } & T`.

**A rota sem build é o alias.** `resolveRule` não importa mais nada de tradução; quem precisa é a rule, e ela chega no motor por `#rform/translate` — que o `vitest.config.ts` aliasa para `runtime/translate/standalone.ts` no projeto `unit`. É a propriedade que o antigo `defaultT` carregava e que não pode se perder: `test/unit/presetsBuiltin.test.ts` continua chamando `preset.validation({ value })` **direto**, sem app, sem build e com a mensagem em pt-BR. `useRForm`, que agrega as rules num `z.any().superRefine`, é a mesma rota.

#### A forma do pack

```
rform.
  fields.                      ← components/fields, via prefixText(scope: "fields")
    array.add
    file.bytes.kb              ← grupo: a própria chave ("bytes") entra no caminho
    date.hint
    date.hintTime
  utils.                       ← components/utils, via prefixText(scope: "utils")
    calendar.time
  presets.
    rules.min.number           ← preset, via trRule({ key: "min.number" })
    rules.required
  formats.
    date                        ← compartilhado; escrito por extenso: tr("rform.formats.date")
```

O topo tem exatamente as quatro raízes que o mecanismo de prefixo consegue produzir: `fields.*` e `utils.*` são o `scope` que `useField`/`useUtil` passam para `prefixText`; `presets.*` e `formats.*` são espaços compartilhados que nada prefixa, escritos por extenso nos call sites (`trRule`, `tr("rform.formats.date")`). Quem guarda essa forma é `test/unit/i18n.test.ts` — `keeps the top level to the four namespaces the prefix can produce` — que também asserta que os dois packs concordam em toda chave, para nenhum locale cair no fallback calado.

`fields.*`/`utils.*` é o que dissolve a antiga preocupação de um campo e um util de mesmo nome disputarem chave: `Calendar` é os dois hoje, e cada um tem a própria raiz — `rform.fields.calendar.*` contra `rform.utils.calendar.*`. Isso já foi um espaço plano só, com os dois lados no mesmo nível e um teste dedicado só para provar que não colidiam; a separação por `scope` torna a colisão impossível em vez de meramente ausente.

`presets.rules.*` pareia com o layout de `src/runtime/presets/{rules,masks}` e deixa espaço para `presets.masks.*` se um dia houver mensagem lá.

#### O mapa de chaves do app (`src/appMessages.ts`)

Com `@nuxtjs/i18n` instalado, o módulo lê o arquivo de mensagens do app e gera `#rform/types/tr.d.ts` — a união `TrInput` que faz de um literal solto numa prop de texto um **erro de compilação**.

**Onde a config é lida: dentro do `getContents` do template, não no `setup`.** O @nuxtjs/i18n resolve `langDir` durante o setup **dele** (`resolve(layer.i18nDir, layer.i18n.langDir ?? "locales")`, com `i18nDir = <rootDir>/<restructureDir ?? "i18n">`), e `getContents` só roda no `builder:generateApp` — o mesmo truque que o `localeFiles()` já usa.

**São duas leituras de config diferentes, e as duas precisam existir.** `declaredLocales()` existe para a ponte e precisa só dos *codes*, então também olha as opções inline do `modules:` — a ponte é registrada durante o setup, quando o i18n ainda pode não ter mesclado nada. `resolveAppMessages()` precisa de `langDir` + `file` já **resolvidos**, e por isso lê o `nuxt.options.i18n` mesclado, tarde. Fontes e momentos distintos.

A decisão de modo mora no `appMessages.ts` com o disco **injetado** (`read`, `warn`) — puro, porque é a decisão que precisa de cobertura e o `module.ts` não tem costura para testar:

| caso | chaves | o que sai |
|---|---|---|
| `.json` do `defaultLocale` | lidas e achatadas | `TrInput = Paramless \| ModuleKey \| WithParams \| Literal` |
| i18n sem nenhum `file` declarado | não há | `TrInput = ModuleKey \| Literal` — **o rigor fica** |
| `.ts`/`.js`, yaml, json5, loader de `lazy: true`, JSON que não parseia | não | `TrInput = string` + `console.warn` nomeando arquivo e motivo |
| sem `@nuxtjs/i18n` | — | `TrInput = string` |

**As duas degradações são diferentes de propósito.** "Nenhum arquivo declarado" não é falha: o app tem i18n, só não há chave do app a oferecer, e exigir chave ou `~~` continua valendo. "Há arquivo e não dá para ler" é falha, e ser rigoroso ali rejeitaria toda chave válida — daí cair para `string`, com aviso.

Só `.json`, e por escolha: `JSON.parse` é zero dependência. Ler `.ts` exigiria executar o arquivo no build, e um loader de `lazy: true` (`defineI18nLocale(async …)`) não tem chave nenhuma para ler — é provavelmente o caso mais comum em produção, e é por isso que o aviso nomeia o motivo.

Detalhe do ambiente: **`@nuxtjs/i18n@10.6.0` lança o próprio `ENOENT` durante o setup dele quando um `file` declarado não existe**, então a degradação por leitura cobre o arquivo *presente e ilegível*, não o ausente — para o ausente o build já morreu antes, no i18n.

Extração, sobre o arquivo do `defaultLocale`, achatado em caminhos pontilhados: as interpolações literais do vue-i18n (`{'…'}`) saem **antes** de procurar params, para que `{'{{contato_nome}}'}` não vire param; params nomeados por `/\{\s*(\w+)\s*\}/g`; plural é a mensagem conter `|`. Sem params e sem plural → `never`; só nomeados → `{ a: Interp }`; só plural → `number`; ambos → a união dos dois.

O `builder:watch` cobre `/(^|[\\/])i18n[\\/].*\.json$/` e chama `builder:generateApp` — inclusive em **edição**, não só add/unlink: o arquivo mora fora do `srcDir` (`<rootDir>/i18n` por padrão) e mudar uma mensagem muda as chaves que o `tr.d.ts` oferece.

#### A ponte é hook, não peer dependency

`nuxt.hook("i18n:registerModule", …)` é a API documentada. O hook **nunca dispara** se o @nuxtjs/i18n não estiver instalado, então não há guarda a escrever nem dependência a declarar — e é por isso que a *detecção* de qual motor entra no bundle não pode depender dele, e usa `hasNuxtModule` (acima).

Quem escolhe o motor é o build; quem acha o `$i18n` é o runtime. O `bridge.ts` lê `tryUseNuxtApp()?.$i18n` e o valida **estruturalmente** (`t` função, `locale` com `.value`) — o módulo é opcional, então não há tipo a importar nem dependência a declarar. Sem `$i18n` por perto (um teste unitário, um `mount()` fora de app), a ponte devolve a chave e um `ref("")`. O `standalone.ts` usa `useState("rform-locale")` semeado com a opção `locale` do módulo (default `"pt-BR"`) quando há app Nuxt, e um `ref` local quando não há — cair de volta em vez de lançar é o ponto, porque `tr` também é chamado de dentro de uma `validation`, muito depois de qualquer setup.

**Os arquivos do `langDir` são escritos na mão, com `writeFile`, além do `addTemplate`.** O @nuxtjs/i18n lê cada um com `readFileSync` durante o setup dele (`analyzeResource`, para descobrir se é objeto ou loader), e template do Nuxt só chega ao disco no `builder:generateApp`, bem depois. O sintoma de esquecer isso é um `ENOENT` apontando para um caminho dentro do próprio `buildDir`.

**Quem manda na lista de codes é o app, e a ponte só responde.** O merge do i18n é por code exato — um app com `locales: ["pt"]` não veria um pack registrado só como `pt-BR` — mas registrar `pt` na marra tem preço: o `mergeConfigLocales` do i18n junta *todos* os configs num `Map` por code, então **um code que só a ponte cita entra na lista de locales do app**, e de lá sai no seletor de idioma dele, no `localeCodes` e no prerender.

Medido no playground com `locales: ["pt", "es"]`: registrando os codes dos packs, o app passa a ter `["pt", "es", "en", "pt-BR"]`. Uma tabela de apelidos (`pt-BR` → `pt`, `en` → `en-US`/`en-GB`…) só piora — são mais codes inventados.

Então o `module.ts` lê os codes que o app declarou (`nuxt.options.i18n.locales` mais as opções inline do `modules:`) e registra **sob esses**, escolhendo o pack por code exato e, na falta, por língua. O app de `pt` + `es` continua com `["pt", "es"]`: o `pt` recebe o pack `pt-BR`, o `es` não recebe nada e cai no `fallbackLocale` do vue-i18n, que é a precedência normal dele. Sem code legível (config de i18n num layer) cada pack entra sob o próprio code — o mínimo que faz a ponte funcionar, e são os codes do módulo, não apelidos.

O `packFor` do `module.ts` é gêmeo em build time do `matchLocale` de `runtime/utils/i18n.ts`, e não um import dele: aquele arquivo só resolve pelo alias `#rform/types/locales`, que não existe em build time — trazê-lo para cá arrastaria o grafo de tipos gerado junto.

O app com i18n sobrescreve qualquer mensagem no próprio `locales/pt-BR.json`, sob a chave `rform` — precedência normal do vue-i18n, sem nada específico do módulo.

#### O que **não** foi localizado

`formatIso`/`formatIsoDate`/`formatIsoDateTime` e o ramo ISO de `parseIncoming`. ISO é o formato do model e é locale-independente por definição: localizá-lo faria o valor gravado mudar com o idioma da tela. Só o segundo ramo de `parseIncoming` — uma string digitada — passa a depender do pack, e por isso a função ganhou um parâmetro de pattern.

Cuidado com esse parâmetro: `arr.map(parseIncoming)` passaria o **índice** como pattern. Por isso `Calendar.vue` e `Date.vue` embrulham em `incoming(value)` antes de mapear.

### `Element<OBJ, C, D>` (`src/type.d.ts`)

- `C` é o field type ("text", "color", ...) e filtra quais presets o `rule` aceita, via `available` de cada um. Todo **campo** passa o seu: `Element<typeof defaults, "text">`. `Form` não passa `C`, porque não é campo e não tem membro no `FieldType`. Os que sobrescrevem o model (`File`, `Hour`, `Number`) passam `D` como terceiro parâmetro.
- Tipa `modelValue`/`default` baseado em `OBJ["default"]` via `ConvertNeverToUnknown`.
- **Não** tipa nada a partir de `OBJ["text"]`, e não tem como — ver "O `Element` não deriva os props de texto", acima. Campo com texto intersecciona `TextProp<typeof defaults.text>` no próprio `Props`, ao lado da entrada em `defaults.text`; `label` e `placeholder` também ficam de fora do `Element` — quem os usa declara o próprio `TrInput` (é o `placeholder?: TrInput` do `File`).
- Atenção: se `defaults.default = null`, então `modelValue?: null` — props com valores diferentes precisam sobrescrever via `Omit<Element<...>, "modelValue" | "default"> & { modelValue?: unknown; default?: unknown }`.

## Gotchas

### `#rform/utils` é o barrel público

O template de `utils.ts` emite `import X from "<path>"` (default, virando `export { X }`) **e** `export * from "<path>"` para cada arquivo de `src/runtime/utils`. É o `export *` que faz `import { defineRule } from "#rform/utils"` funcionar. De lá saem também `tr` e `trRule`, `defineLocale` e `prefixText`.

Os specifiers do `export *` passam por `specifier()` e saem **sem extensão**. Com `.ts` no caminho, o TS precisa de `allowImportingTsExtensions` e um app consumidor normalmente não liga — o sintoma é `TS2614: Module '#rform/utils' has no exported member 'defineRule'`, como se o barrel não exportasse nada nomeado.

Consequência de carga, da mesma classe que a do zod: **importar qualquer coisa do barrel puxa a pilha de tradução inteira**, e num app sem i18n isso inclui o `@intlify/core` e todos os packs de locale. O barrel é ansioso por construção — é o preço de ele ser a entrada pública única.

#### O `import` vem pareado com o próprio `export *`, e os reentrantes vão para o fim

O template não emite um bloco de `import` seguido de um bloco de `export *`: **cada `import` vem colado ao `export *` do mesmo arquivo**, e os helpers que fazem *value import* de `#rform/*` são estavelmente ordenados para o **fim** da lista.

Isso existe porque `utils/tr.ts` fechou um ciclo de verdade:

```
#rform/utils → tr.ts → #rform/translate → standalone.ts → #rform/locales
             → um pack de locale do usuário → import { defineLocale } from "#rform/utils"
```

O vite-node **rebaixa `export * from` para uma chamada posicional `__vite_ssr_exportAll__`**, não para um live binding. Na reentrada, portanto, só enxerga-se o que os `export *` que **já rodaram** trouxeram — não basta o `export *` estar declarado depois no arquivo, ele precisa não ter executado. O sintoma foi `defineLocale is not a function`, apontando para o **pack do usuário**, que não tem culpa nenhuma.

O predicado é `importsRformValue` (`module.ts`), e ele **ignora import type de propósito**: `import type { Base } from "#rform/types"` é apagado na compilação e nunca roda código — sem essa exclusão, quase todo helper qualificaria como reentrante e a ordenação perderia o sentido. Duas lacunas conhecidas dele, as duas por ser linha a linha:

- `import { type Foo } from "#rform/x"` — todo o conteúdo inline-type. Falso **positivo**: manda o helper para o fim sem necessidade, e não quebra nada.
- um `import` quebrado em **várias linhas**. Falso **negativo**, e esse deixaria o ciclo voltar. Um helper novo que faça value import de `#rform/*` precisa escrever a declaração numa linha só.

Ordenar em vez de contar com o `readdir` (que hoje põe `i18n.ts`, dono do `defineLocale`, antes de `tr.ts`) é o que torna a propriedade independente do que for adicionado ou renomeado nesse diretório depois.

### Um `@` literal numa mensagem precisa ser `{'@'}`

`@:chave` é a sintaxe de mensagem ligada (*linked message*) do vue-i18n, e ela não pede opt-in — um `@` cru em qualquer pack, do módulo ou do app, é interpretado como o início de uma. Um e-mail (`"Fale com a gente: contato@empresa.com"`) já derrubou uma mensagem do playground assim: em runtime, `"Invalid linked format (error code: 10)"`, nomeando o caminho da mensagem quebrada — não o `@`, então o sintoma não aponta pro problema.

A saída é escrever o `@` como interpolação literal, `{'@'}` — a mesma sintaxe que já escapa `{'{{...}}'}` para um par de chaves cru. E o gerador de `TrInput` (`src/appMessages.ts`, `messageParams`) já conta com isso: ele **remove** todo `{'…'}` antes de procurar `{param}`, então escapar o `@` não inventa um param fantasma — o comportamento é o mesmo que já existe para chaves literais, só que aplicado ao caso que ninguém tinha testado até morder.

### O preview do autofill é invisível para o JS

Passar o mouse sobre uma sugestão do preenchedor do browser pinta o valor no `input` **sem** disparar `input`/`change` — o `model` continua vazio, então o `RUtilsPlaceholder` fica em `notFilled` (atrás do campo, `-z-10`) e os dois textos se sobrepõem. Não há evento para escutar; quem enxerga esse estado é só o CSS, via `:-webkit-autofill` (que casa preview **e** valor comitado — Chrome, Safari e Firefox 86+; `:-internal-autofill-previewed`, que separaria os dois, é restrito à UA stylesheet e não parseia em folha de autor).

Daí o par: o `Placeholder.vue` emite `data-floating` quando virou label flutuante, e o `style.css` faz `.RField :has(:-webkit-autofill) > .RUtilsPlaceholder:not([data-floating]) { opacity: 0 }`. O `>` é o que limita ao placeholder cujo pai contém o input — sem ele o `:has()` casaria todo ancestral dentro do campo. O `:not([data-floating])` preserva o caso sem `label`, em que depois do autofill comitado é o próprio placeholder que rotula o valor lá em cima.

**Ancorar em `.RForm` não serve, e é o motivo de as classes-gancho existirem.** O autofill não depende de `<form>`: o Chrome agrupa campos soltos ("unowned form fields") por heurística de DOM desde a v91, e `useField` faz `inject(key, undefined)` — campo sem `RForm` pai é caso suportado.

Nenhuma utility do Tailwind declara `opacity: 1` no estado base, então a regra vence independentemente da ordem de layer — não precisa de `!important` como o `[data-autocompleted]`.

### `transition-[a_b]` com duas propriedades é silenciosamente `all`

`transition-[translate_position]` vira `transition-property: translate position` — sem vírgula, é sintaxe inválida, a declaração é descartada e a propriedade volta ao inicial `all`. Com o `duration-300` ao lado, **tudo** passa a animar, `opacity` incluída: o `disable` (`opacity-0`) do placeholder ganhava um fade de 300ms ao sumir e voltar. Vírgula é o separador (`transition-[translate,top,left]`); `_` só serve para espaço *dentro* de um valor.

Compila, passa na lint e não emite aviso nenhum. Para conferir o que o Tailwind de fato emitiu: `compile("@tailwind utilities;", { base }).build([classe])` da API de `tailwindcss`.

### `size()` do floating-ui sempre ganha do `flip()`

O `RUtilsDropdown` posiciona com `offset → flip → shift → middleware do campo`, e o campo que passa middleware é o `Select`, com um `size()` que casa a largura da referência e limita a altura ao espaço disponível. Os dois disputam o mesmo elemento, e **o `size` ganha**: ele devolve `reset: { rects: true }` sempre que o `apply` mudou as dimensões, e o `computePosition` reinicia a cadeia (`i = -1`) com rects novos. Na volta, o `flip` mede um painel **já** achatado no que cabe embaixo — sem overflow, sem flip.

E o achatamento já está lá antes de abrir: o `autoUpdate` continua recalculando com o painel fechado (`v-show` deixa ele na árvore, 0×0), então o primeiro `open` acontece com um `maxHeight` medido para o espaço de baixo. Medido no harness sintético do teste, com o campo a 100px do fim da viewport: `bottom-start` com **35px** de altura, aberto ou fechado, para sempre.

Quem destrava é o piso do `dropdownFit` (`src/runtime/utils/dropdownMiddleware.ts`): `max(DROPDOWN_MIN_HEIGHT, availableHeight - 10)`. Recusando encolher abaixo de 160px, sobra overflow para o `flip` enxergar — aí ele vira para cima e o `size` da passada seguinte recalcula com o espaço de lá. O piso pode transbordar a viewport no único caso em que nenhum dos dois lados tem 160px; é o preço, e é deliberado.

Ordem: `size` **depois** do `flip`, que é o que a doc recomenda para o `fallbackStrategy` default (`bestFit`) — o outro par documentado é `size` antes com `initialPlacement`, e aí um campo espremido dos dois lados voltaria para baixo em vez de escolher o lado maior.

Nada disso aparece em teste de componente: jsdom e happy-dom não têm layout, todo rect é 0. `test/unit/dropdownMiddleware.test.ts` roda o `computePosition` de verdade sobre uma plataforma sintética (viewport fixa como clipping rect, altura do painel = conteúdo limitado pelo `maxHeight` que o `apply` escreveu) e computa **duas** vezes, fechado e aberto, porque o bug só existe no segundo.

#### O painel é do Dropdown: `z-999`, `--width` e um endereço só

O `apply` do `dropdownFit` escreve a largura da referência como `--width` no painel, por `setProperty` — custom property atribuída num `CSSStyleDeclaration` vira propriedade JS comum e nunca chega ao CSS. Quem lê é o `w-(--width)` do **default do `RUtilsDropdown`**, ao lado do `z-999` que os três campos repetiam.

O motivo de a largura ser classe e não `width` inline é precedência: inline ganha de qualquer classe, então um `ui: { Utils: { Dropdown: { popover: "w-80" } } }` não tinha como vencer e perdia calado (é o caso do `playground/app/components/Locale.vue`). Como classe, o override é o `twMerge` de sempre: `w-80` substitui `w-(--width)`, e a medida do `size` deixa de ser lida — o `reset: { rects: true }` continua acontecendo, porque a largura renderizada muda do mesmo jeito.

**Toda aparência de painel mora em `ui.Utils.Dropdown.popover`, nunca num `class` no template do campo**, e é isso que faz os três campos conviverem:

| campo | `popover` | resultado do `twMerge` |
|---|---|---|
| `Select` | `overflow-auto rounded-… border… bg…` | `z-999 w-(--width) overflow-auto …` |
| `Date` | `w-72` | `z-999 w-72` |
| `Color` | `flex w-64 flex-col …` | `z-999 flex w-64 flex-col …` |

`Date` e `Color` não passam `dropdownFit`, então não têm `--width` declarado — e `w-(--width)` sem a variável renderiza `width: auto`. Se a largura deles continuasse num `class` do template, as duas classes cairiam no mesmo elemento **sem passar pelo merge**, e quem ganha aí é a ordem da folha de estilo, não a ordem do atributo: o painel abriria com a largura errada, compilando e sem aviso. Foi por isso que o `popover` do `RDate` e o `picker.container` do `RColor` mudaram de endereço.

A variável é `--width` e não `--rf-width` de propósito: ela é medida por elemento, não é token de tema, e `test/unit/theme.test.ts` exige que todo `--rf-*` lido num componente esteja declarado no `style.css` — o que um valor inline nunca estará.

As guardas: `test/unit/dropdownMiddleware.test.ts` mede a largura do painel a partir de `style["--width"]` e asserta que `style.width` fica `undefined` (o inline não pode voltar); `test/nuxt/dropdownPopover.test.ts` monta os três campos e confere o `z-999` em todos, o `w-(--width)` só onde há medida, a troca por `w-72`/`w-64` onde não há, e o override por `ui`.

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

### "Union type too complex" em useField

Generics com conditional types nas `Props` (ex.: `Multiple extends true ? T[] : T` no slot) cascateiam complexidade quando passados para `useField<T extends Element>`. **Solução:** declarar um tipo `InternalProps` simples (sem generics) e castear na chamada — `await useField(_props as unknown as InternalProps)`. Mantém o tipo público rico sem estourar o type-checker.

Quando o slot precisa expor um tipo conditional (`Multiple extends true ? Item[] : Item`), criar helpers em script (`fieldSlot()`, `rowSlot(option)`) que retornam `as Selected` — o template não suporta cast `as` direto em expressões.

### `addComponentsDir` não aninha

O scanner do Nuxt guarda cada diretório já varrido e pula todo arquivo sob ele (`if (scannedPaths.some(d => filePath.startsWith(d))) continue`). Registrar `components/` deixaria `components/fields` e `components/utils` **vazios**, sem erro nenhum — some a tag, não o build. Por isso `Form` e `Dynamic` entram por `addComponent`, um a um, e só `fields/` e `utils/` (mais as duas raízes do usuário, com `priority: 10`) entram como diretório.

`addComponent` também **não normaliza** o `filePath`, ao contrário do `addComponentsDir`. Com `\` do Windows o caminho vira import com escapes (`"C:UsersyandProjetos…"`) e o teste falha na coleta, não na asserção. `filePath()` no `module.ts` já devolve com `/`.

### O vite plugin roda antes do `@vitejs/plugin-vue`

Com `enforce: "pre"` o plugin vê o SFC cru; sem ele, o id `.vue` já foi compilado para um `import` de `?vue&type=script&setup=true`, a chamada da composable está nesse sub-request, e reescrever o que sobrou não muda nada. Rodando depois, a injeção de nome **não funcionava em build de produção** — e ninguém via, porque o fallback `"Text"`/`"Label"` cobria calado.

A consequência é que a regex passa a ver TypeScript cru: `useUtil<Props>()`, com o genérico entre o nome e o `(`. As regexes aceitam e **preservam** a lista de tipos.

### As classes-gancho (`RField` / `RUtil`) entram pelo `ui`

Todo campo e todo util — embutido **e** do usuário — carrega duas classes na raiz:

| raiz | genérica | específica |
|---|---|---|
| `fields/`, `app/rform/fields` | `RField` | `R<Nome>` — `RField RText` |
| `utils/`, `app/rform/utils` | `RUtil` | `RUtils<Nome>` — `RUtil RUtilsPlaceholder` |

A específica espelha a tag que o app escreve (`<RText>` → `.RText`), porque os prefixos são os mesmos que o `addComponentsDir` registra. É isso que dá ao `style.css` um alvo, sem que campo nenhum precise repetir a classe e **sem depender de `RForm` no ancestral**.

Quem escreve é `hookUi` (`src/runtime/utils/hookUi.ts`), chamado por `useField` e por `useUtil` **depois** do `merger`, sobre a **entrada mais alta** do `ui`: `container` num campo, `default` no `Placeholder`, o próprio `ui` onde ele é string. Não é o primeiro par qualquer — é a primeira entrada que guarda classes em vez de um grupo aninhado, porque o `RUtilsLoading` abre num `<Transition>` cujo `ui.transition` são nomes de transição, não classe. Componente sem nenhuma entrada de classe (`RUtilsDropdown` é `<slot>` + `<Transition>`) fica sem gancho, e não tem reset a perder.

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

**O playground é o único lugar que exercita a ponte com o @nuxtjs/i18n** — ele está no `playground/package.json` com `pt-BR`/`en` e `strategy: "no_prefix"`, e o seletor (`app/components/Locale.vue`) mora no rodapé do `Default.vue`, ao lado do de tema. Por tabela, é ele que dá cobertura de `vue-tsc` à ponte.

E ao gerador estrito: ele declara `langDir: "locales"` com `i18n/locales/{pt-BR,en}.json` de verdade, então o `TrInput` dele é a união completa e **todo literal solto numa prop de texto das páginas é erro de `vue-tsc`** — parte dos labels virou chave, parte virou `~~`. É o custo da decisão em forma de trabalho real. A fixture, sem i18n, é a cobertura do outro extremo: `TrInput = string`, `tr` identidade e `~~Nome` impresso com os til.

A fixture (`test/fixtures/basic/rform/`) tem os três casos de componente que os testes cobrem — `fields/Rating.vue` (campo novo), `fields/Switch.vue` (substitui um embutido via `#rform/builtin`) e `utils/Hint.vue` (util novo) — mais `locales/pt-BR.ts`, um pack de usuário com uma chave sobrescrita. Ela fica **sem** @nuxtjs/i18n de propósito: é ela que cobre o resolvedor próprio.
