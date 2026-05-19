# AccessPIM AI - Sistema Distribuido de Controle de Acesso

Este repositorio contem a base do projeto AccessPIM AI, um sistema de controle de acesso industrial focado em Edge Computing e reconhecimento facial. A arquitetura foi projetada para garantir baixa latencia e tolerancia a falhas, utilizando um processamento hibrido entre dispositivos de borda e servicos em nuvem.

## Estrutura do Projeto

O projeto esta organizado de forma modular para refletir uma arquitetura de sistemas distribuidos:

* **/backend**: Servidor central (Nuvem) desenvolvido em Node.js, responsavel pela consolidacao de logs, gerenciamento de banco de dados e auditoria.
* **/edge**: Scripts de simulacao para o hardware da catraca, desenvolvidos em Python. Representam o processamento local (Edge Computing).
* **/frontend**: Estrutura preparada para receber o dashboard administrativo em Angular.

## O que foi implementado ate agora

1.  **Infraestrutura de Banco de Dados**: Configuracao de um banco de dados relacional PostgreSQL (via Neon.tech) pronto para armazenar colaboradores e registros de acesso.
2.  **Servidor de Log (API)**: Criacao de rotas no backend para receber e registrar tentativas de acesso enviadas pelos dispositivos de borda.
3.  **Simulador de Hardware (Catraca)**: Desenvolvimento de um script interativo em Python que simula o comportamento fisico e logico de uma catraca inteligente.
4.  **Conceito de Resiliencia**: O sistema ja opera com independencia entre as camadas. A catraca toma decisoes de acesso localmente e sincroniza as informacoes com a nuvem de forma assincrona.

## Como executar a simulacao

Siga os passos abaixo para rodar o ambiente de teste em sua maquina local.

### 1. Pre-requisitos
* Node.js instalado (v18 ou superior).
* Python 3 instalado.
* Biblioteca `requests` do Python (instalada via `pip install requests`).

### 2. Iniciando o Backend (Servidor Central)
O servidor deve estar ativo para que os logs de acesso sejam registrados.
1. Abra o terminal na raiz do projeto.
2. Navegue ate a pasta backend: `cd backend`
3. Instale as dependencias (se for a primeira vez): `npm install`
4. Inicie o servidor: `node server.js`
*O terminal exibira uma mensagem indicando que o servidor esta rodando na porta 3000.*

### 3. Executando a Catraca (Simulador de Borda)
Com o servidor rodando, abra um **novo terminal** para simular o dispositivo fisico.
1. Navegue ate a pasta do projeto.
2. Execute o script: `python edge/catraca.py`

### 4. Interacao no Simulador
Ao executar o script da catraca, voce vera um menu no terminal:
* **Digitar 1**: Simula um funcionario autorizado. O script validara o acesso localmente, enviara o sinal de abertura do hardware e, em seguida, sincronizara o log com o servidor.
* **Digitar 0**: Simula um acesso negado. A catraca permanecera travada e o registro de tentativa de invasao sera enviado para a nuvem..

## Diferencial Tecnico até agora

A simulacao prova que a decisao de abertura da porta ocorre na borda (Edge), garantindo que, mesmo em caso de falha de conexao com o servidor central, a operacao da fabrica nao seja interrompida, mantendo os registros em cache local para sincronizacao posterior.
