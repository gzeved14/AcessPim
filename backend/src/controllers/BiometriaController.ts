import { Request, Response } from 'express';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

// Variáveis globais para guardar a câmera na memória do servidor
let processoLeitor: ChildProcess | null = null;
let processoCadastro: ChildProcess | null = null;

// Caminho para a pasta onde ficam seus scripts Python
const EDGE_PATH = path.resolve(__dirname, '../../../edge/src'); 

export class BiometriaController {

    // LIGA A CATRACA (Testar Leitor)
    iniciarLeitor(req: Request, res: Response): any {
        if (processoLeitor) {
            return res.status(400).json({ message: "O leitor facial já está ligado!" });
        }
        if (processoCadastro) {
            return res.status(400).json({ message: "Câmera em uso pelo cadastro. Feche-o primeiro." });
        }

        const scriptPath = path.join(EDGE_PATH, 'reconhecer_rosto.py');
        processoLeitor = spawn('python', [scriptPath], {shell: true});

        // 🎯 AGORA VAMOS VER O QUE O PYTHON ESTÁ FALANDO
        processoLeitor.stdout?.on('data', (data) => {
            console.log(`[PYTHON LOG]: ${data.toString().trim()}`);
        });

        processoLeitor.stderr?.on('data', (data) => {
            console.error(`[PYTHON ERRO]: ${data.toString().trim()}`);
        });

        processoLeitor.on('close', (code) => {
            console.log(`[PYTHON] Leitor encerrado. Código: ${code}`);
            processoLeitor = null;
        });

        return res.status(200).json({ message: "Leitor Facial ativado na Catraca!" });
    }

    // DESLIGA A CATRACA
    pararLeitor(req: Request, res: Response): any {
        if (!processoLeitor) {
            return res.status(400).json({ message: "O leitor já está desligado." });
        }
        spawn("taskkill", ["/pid", processoLeitor.pid?.toString() || "", "/f", "/t"]);
        processoLeitor = null;
        return res.status(200).json({ message: "Leitor Facial desativado." });
    }

    // INICIA O CADASTRO DE UM NOVO ROSTO
    cadastrarRosto(req: Request, res: Response): any {
        const { colaboradorId } = req.body;

        if (!colaboradorId) return res.status(400).json({ message: "ID do colaborador é obrigatório." });
        if (processoCadastro) return res.status(400).json({ message: "Já existe um cadastro em andamento." });
        if (processoLeitor) return res.status(400).json({ message: "Desligue a catraca antes de cadastrar um rosto." });

        const scriptPath = path.join(EDGE_PATH, 'cadastrar_rosto.py');        
        
        processoCadastro = spawn('python', [scriptPath, String(colaboradorId)], { shell: true });

        processoCadastro.stdout?.on('data', (data) => {
            console.log(`[PYTHON LOG]: ${data.toString().trim()}`);
        });

        processoCadastro.stderr?.on('data', (data) => {
            console.error(`[PYTHON ERRO]: ${data.toString().trim()}`);
        });

        processoCadastro.on('close', (code) => {
            console.log(`[PYTHON] Cadastro encerrado. Código: ${code}`);
            processoCadastro = null;
        });

        return res.status(200).json({ message: "Câmera ativada. Siga as instruções na tela do PC." });
    }

    excluirBiometria(req: Request, res: Response): any {
        const { colaboradorId } = req.body;
        if (!colaboradorId) return res.status(400).json({ message: "ID não fornecido."});

        const pastaColaborador = path.join(EDGE_PATH, 'dataset', String(colaboradorId));

        try {
            if (fs.existsSync(pastaColaborador)){
                fs.rmSync(pastaColaborador, { recursive: true, force: true });
                return res.status(200).json({ message: "Biometria removida fisicamente em conformidade com a LGPD." });
            } else {
                return res.status(500).json({ message: "Nenhum dado biométrico encontrado para este usuário."});
            }
        } catch (error) {
            return res.status(500).json({ message: "Erro ao tentar expurgar os dados biométricos."});
        }
    }
}