// Niveis de risco aceitos para classificar a area restrita.
export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

// Estrutura de dados usada para representar uma area no front.
export interface Area {
    // Identificador unico da area.
    id: string;
    // Nome exibido na interface.
    nome: string;
    // Descricao livre da area.
    descricao?: string;
    // Nivel de risco da area, usado em destaque visual.
    nivel_risco: NivelRisco;
    responsavel_id: string;
    capacidade: number;
    ativa: boolean;
}