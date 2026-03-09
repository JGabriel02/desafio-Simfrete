# 📦 Sistema de Logística e Roteamento (CLI)

Um sistema de linha de comando (CLI) desenvolvido em JavaScript (Node.js) para resolver dois problemas clássicos de logística: identificação de áreas de cobertura por CEP e cálculo da rota de transporte mais barata entre cidades.

## 🚀 Funcionalidades

1. **Busca de Cidade por CEP (Parte 1):** - Lê uma base de dados de cidades e suas respectivas faixas de CEP.
   - Retorna a qual cidade um CEP específico pertence.
   - **Diferencial:** Lida com sobreposições de CEPs aplicando a regra de negócio da "faixa mais específica" (o menor intervalo numérico entre o CEP inicial e final ganha).

2. **Cálculo de Rota Mais Barata (Parte 2):**
   - Dada uma origem e um destino (buscados via CEP), calcula a rota de frete com o menor custo financeiro.
   - Utiliza o **Algoritmo de Dijkstra** construído do zero para encontrar o caminho mais curto em um grafo ponderado (lista de adjacência).
   - Lida com rotas duplicadas no banco de dados, priorizando sempre a mais barata.

## 🛠️ Tecnologias Utilizadas

- **JavaScript (ES6+)**
- **Node.js** (Módulos nativos: `fs` para leitura de arquivos e `readline/promises` para o menu interativo).
- Nenhuma biblioteca externa (Zero dependências).

## ⚙️ Como executar o projeto

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado na sua máquina (versão 14 ou superior).

### Passo a passo

1. Clone este repositório ou baixe os arquivos para o seu computador.
2. Na raiz do projeto, certifique-se de que o arquivo `entrada.txt` está presente com os dados de cidades e rotas.
3. Abra o seu terminal, navegue até a pasta do projeto e rode o comando:

\`\`\`bash
node desafio.js
\`\`\`

4. O menu interativo aparecerá na tela. Basta digitar a opção desejada (1, 2 ou 3) e seguir as instruções.

## 📄 Formato do arquivo de dados (`entrada.txt`)

O sistema espera um arquivo chamado `entrada.txt` na mesma pasta do script, dividido em dois blocos separados por uma linha com `--`:

1. **Cidades e CEPs:** `NomeDaCidade,CEP_Inicial,CEP_Final`
2. **Rotas e Custos:** `Origem,Destino,Custo`

*Exemplo de estrutura válida:*
\`\`\`text
A,00000000,00000500
B,00000125,00000375
--
A,B,15.50
B,A,20.00
\`\`\`

## 🧠 Lógica e Estrutura de Dados
- **Parsing:** Transformação de texto bruto (`.txt`) em um Array de objetos e um Grafo (Dicionário).
- **Grafo:** As conexões entre as cidades são modeladas em um objeto JavaScript, permitindo buscas rápidas em tempo de execução `O(1)`.
- **Dijkstra:** Implementado de forma iterativa, mantendo um registro de "nós visitados" e "distâncias mínimas", rastreando os caminhos anteriores para reconstruir a rota no final.
