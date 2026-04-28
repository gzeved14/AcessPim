// Importa funcionalidades de anotação/TypeORM de coluna, entidade, criação de Data Automática entre outros para definir schema.
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
// Puxa uma classe tipada Cargo que define se os valores da respectiva coluna são compatíveis.
import { Cargo } from "../types/Cargo.js";
import { JoinColumn } from "typeorm";
// Usa type imports para fazer as tipagens de Area e RegistroAcesso de modo a evitar referências circulares em relacionamentos do TypeScript.
import type { Area } from "./Area.js";
import type { RegistroAcesso } from "./RegistroAcesso.js";

// Especifica e conecta a Classe com a Tabela correspondente "colaborador" dentro do banco relacional PostgreSQL.
@Entity("colaborador")
export class Colaborador {
    
    @PrimaryGeneratedColumn("uuid") //faz o banco de dados gerencia automaticamente um id único para cada usuário
    id!: string;

    // Representa a coluna Nome contendo o valor texto e recusando criação se o input de preenchimento for vazio(nulo).
    @Column({ type: 'text', nullable: false })
    nome!: string;

    // Representa a matrícula do funcionário. O parametro unique: true configura constraints do próprio banco que impedem duplicação desse valor por qualquer método.
    @Column({ type: 'text', unique: true, nullable: false })
    matricula!: string;
    
    // Setor em formato texto que define em qual parte da estrutura está o funcionário e recusa ausência de preenchimento.
    @Column({ type: 'text', nullable: false })
    setor!: string;

    // Coluna descritiva de qual cargo hierarquicamente formatado esse Colaborador atua e obedece as exigências da estrutura tipada Cargo (ex. Admin, Gerente, Peao).
    @Column({ type: 'text', nullable: false })
    cargo!: Cargo;

    // Define em banco uma chave bool (0 ou 1 / true ou false), que na criação adquire valor true se nada foi dito por parte do cliente da api.
    @Column({ type: 'boolean', default: true, nullable: false })
    ativo!: boolean;

    // Coluna para imagem do perfil que se omitida não faz diferença pro cadastro global.
    @Column({ type: 'text', nullable: true })
    foto_url!: string | null;

    // Gera um trigger interno com função nativa para estampar e gravar o momento em "DateTime" na primeira vez que for inserido no banco sem depender do sistema backend.
    @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
    criado_em!: Date;

    @OneToMany("RegistroAcesso", (registro: RegistroAcesso) => registro.colaborador)
    acessos!: RegistroAcesso[]; //O histórico de um colaborador é a soma de todos os seus registros de entrada e saída.

    // Cria uma chave associada a chave estrangeira em Área para retornar quais Áreas ele gerencia.
    @OneToMany("Area", (area: Area) => area.responsavel, { nullable: false })
    areas_sob_responsabilidade!: Area[]; 

}