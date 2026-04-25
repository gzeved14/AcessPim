// Estrutura de dados usada para representar um colaborador no front.
export interface Colaborador {
    // Identificador unico do colaborador.
    id: string;
    // Nome completo exibido nas telas.
    nome: string;
    // Matricula funcional usada para controle interno.
    matricula: string;
    // Cargo ocupacional do colaborador.
    cargo: string;
    // Setor de lotacao do colaborador.
    setor: string;
    // Indica se o colaborador pode ser selecionado em novas operacoes.
    ativo: boolean;
    // URL opcional da foto de perfil.
    fotoUrl?: string;
}