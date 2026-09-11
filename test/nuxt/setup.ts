import { config } from "@vue/test-utils";

// O painel do `RUtilsDropdown` é teleportado para `#teleports`, e o `find` do VTU
// só anda a árvore sob o root do wrapper — com o Teleport real, todo teste que abre
// um painel deixaria de encontrar suas opções. O stub o renderiza no lugar. Quem
// precisa ver o painel onde ele de fato pousa desliga por mount
// (`global: { stubs: { teleport: false } }`).
config.global.stubs.teleport = true;