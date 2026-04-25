import { Usuario } from "../entities/Usuario.js";
import { Repository, DataSource } from "typeorm";
import { AppError } from "../errors/AppError.js";
import { hash } from "bcryptjs";
export class UsuarioService {
    repo;
    constructor(dataSource) {
        this.repo = dataSource.getRepository(Usuario);
    }
    async create(data) {
        const { nome, matricula, email, senha, setor, cargo } = data;
        if (!nome || !matricula || !email || !senha || !setor || !cargo) {
            throw new AppError("Dados obrigatórios ausentes", 400);
        }
        const userExists = await this.repo.findOneBy({ email });
        if (userExists) {
            throw new AppError("Email já cadastrado no sistema", 400);
        }
        const senhaHash = await hash(senha, 10);
        const newUser = this.repo.create({
            nome,
            matricula,
            email,
            senha_hash: senhaHash,
            setor,
            cargo
        });
        const userSaved = await this.repo.save(newUser);
        const { senha_hash, ...userNoPassword } = userSaved;
        return userNoPassword;
    }
    async findById(id) {
        const user = await this.repo.findOne({
            where: { id: id },
            select: ["id", "nome", "email", "cargo", "setor", "matricula"]
        });
        if (!user) {
            throw new AppError("Usuário não encontrado", 404);
        }
        return user;
    }
    async findAll() {
        return await this.repo.find({
            select: ["id", "nome", "email", "cargo", "setor", "criado_em"],
            order: { nome: "ASC" }
        });
    }
    async findByEmailForLogin(email) {
        return await this.repo.findOne({
            where: { email },
            select: ["id", "nome", "email", "senha_hash", "cargo"]
        });
    }
    async update(id, data) {
        const user = await this.repo.findOneBy({ id });
        if (!user) {
            throw new AppError("Usuário não encontrado", 404);
        }
        if (data.email && data.email !== user.email) {
            const userWithEmail = await this.repo.findOneBy({ email: data.email });
            if (userWithEmail) {
                throw new AppError("Email já cadastrado no sistema", 400);
            }
            user.email = data.email;
        }
        if (data.matricula && data.matricula !== user.matricula) {
            const userWithMatricula = await this.repo.findOneBy({ matricula: data.matricula });
            if (userWithMatricula) {
                throw new AppError("Matrícula já cadastrada no sistema", 400);
            }
            user.matricula = data.matricula;
        }
        if (data.nome !== undefined)
            user.nome = data.nome;
        if (data.setor !== undefined)
            user.setor = data.setor;
        if (data.cargo !== undefined)
            user.cargo = data.cargo;
        if (data.senha) {
            user.senha_hash = await hash(data.senha, 10);
        }
        const updatedUser = await this.repo.save(user);
        const { senha_hash, ...userNoPassword } = updatedUser;
        return userNoPassword;
    }
}
//# sourceMappingURL=UsuarioService.js.map