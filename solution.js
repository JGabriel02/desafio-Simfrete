// Importo o módulo fs para conseguir ler arquivos do sistema
const fs = require("fs");

// Importo o readline para conseguir interagir com o usuário no terminal
const readline = require("readline/promises");

// Essa função é responsável por pegar o conteúdo do arquivo txt
// e transformar ele em estruturas que o sistema consegue usar
function processarArquivo(txt) {
  // Aqui eu separo o arquivo em duas partes usando "--" como divisor
  // A primeira parte tem as cidades e a segunda tem as rotas
  let partes = txt.split("\n--\n");

  // Aqui eu separo as linhas das cidades e removo linhas vazias
  // O trim ajuda a evitar erro caso tenha espaço ou linha em branco
  let cidadesRaw = partes[0].split("\n").filter((l) => l.trim() !== "");

  // Mesma lógica aqui, mas para as rotas
  let rotasRaw = partes[1].split("\n").filter((l) => l.trim() !== "");

  // Aqui eu transformo cada linha de cidade em um objeto
  // Cada cidade tem nome, cep inicial e cep final
  let listaCidades = cidadesRaw.map((linha) => {
    let [nome, ini, fim] = linha.split(",");
    return { nome, ini: Number(ini), fim: Number(fim) };
  });

  // Aqui eu crio um grafo vazio
  // A ideia é usar um grafo porque ele facilita calcular rotas entre cidades
  let grafo = {};

  // Cada cidade vira um "nó" no grafo
  listaCidades.forEach((c) => (grafo[c.nome] = {}));

  // Agora eu percorro todas as rotas
  rotasRaw.forEach((linha) => {
    // Cada rota tem origem, destino e custo
    let [de, para, valor] = linha.split(",");
    let custo = Number(valor);

    // Aqui eu verifico se já existe uma rota registrada
    // Se existir, eu guardo apenas a rota mais barata
    if (!grafo[de][para] || custo < grafo[de][para]) {
      grafo[de][para] = custo;
    }
  });

  // Retorno as cidades e o grafo para serem usados no sistema
  return { listaCidades, grafo };
}

// Essa função serve para descobrir qual cidade pertence a um CEP
function buscarCidade(cep, listaCidades) {
  // Aqui eu filtro todas as cidades onde o CEP está dentro do intervalo
  let matches = listaCidades.filter((c) => cep >= c.ini && cep <= c.fim);

  // Se não encontrar nenhuma cidade, retorna null
  if (matches.length === 0) return null;

  // Caso mais de uma cidade tenha esse CEP
  // eu escolho a cidade com o menor intervalo de CEP
  let cidadeCerta = matches[0];
  let menorTamanho = cidadeCerta.fim - cidadeCerta.ini;

  for (let i = 1; i < matches.length; i++) {
    let tamAtual = matches[i].fim - matches[i].ini;

    // Se o intervalo atual for menor, significa que é mais específico
    if (tamAtual < menorTamanho) {
      menorTamanho = tamAtual;
      cidadeCerta = matches[i];
    }
  }

  // Retorno apenas o nome da cidade encontrada
  return cidadeCerta.nome;
}

// Essa função calcula a rota mais barata entre dois CEPs
function calcularRotaMaisBarata(cepOrigem, cepDestino, cidades, grafo) {
  // Primeiro eu descubro quais cidades correspondem aos CEPs
  let origem = buscarCidade(Number(cepOrigem), cidades);
  let destino = buscarCidade(Number(cepDestino), cidades);

  // Se algum CEP não existir nas cidades, retorna erro
  if (!origem || !destino)
    return { erro: "CEP não encontrado nas faixas de cidades." };

  // Estruturas usadas no cálculo da rota
  let dist = {}; // guarda menor custo até cada cidade
  let anterior = {}; // guarda o caminho percorrido
  let visitados = []; // cidades que já foram analisadas

  // Inicialmente todas as cidades recebem uma distância muito grande
  cidades.forEach((c) => (dist[c.nome] = 9999999));

  // A cidade de origem começa com custo 0
  dist[origem] = 0;

  // Loop principal da busca de menor caminho
  while (true) {
    let atual = null;
    let menor = 9999999;

    // Aqui eu procuro a cidade com menor custo que ainda não foi visitada
    for (let c in dist) {
      if (!visitados.includes(c) && dist[c] < menor) {
        menor = dist[c];
        atual = c;
      }
    }

    // Se não tiver mais cidades ou já chegamos no destino, termina
    if (!atual || atual === destino) break;

    // Marco a cidade atual como visitada
    visitados.push(atual);

    // Agora verifico os vizinhos da cidade atual
    for (let vizinho in grafo[atual]) {
      // Calculo o custo passando pela cidade atual
      let custoPassandoPorAqui = dist[atual] + grafo[atual][vizinho];

      // Se esse caminho for mais barato, atualizo
      if (custoPassandoPorAqui < dist[vizinho]) {
        dist[vizinho] = custoPassandoPorAqui;

        // Guardo de onde eu vim para montar o caminho depois
        anterior[vizinho] = atual;
      }
    }
  }

  // Se o custo continuar grande significa que não existe rota
  if (dist[destino] === 9999999)
    return { erro: "Rota impossível, sem caminho." };

  // Aqui eu reconstruo o caminho do destino até a origem
  let rota = [];
  let noAtual = destino;

  while (noAtual) {
    rota.unshift(noAtual);
    noAtual = anterior[noAtual];
  }

  // Retorno as informações da rota encontrada
  return {
    de: origem,
    para: destino,
    caminho: rota.join(" -> "),
    custo: dist[destino].toFixed(2),
  };
}

// Função principal que roda o sistema no terminal
async function rodarSistema() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let dados;

  // Aqui tento carregar o arquivo de dados
  try {
    let txt = fs.readFileSync("./entrada.txt", "utf-8");

    // Processa o arquivo e cria as estruturas de cidades e rotas
    dados = processarArquivo(txt);
  } catch (err) {
    // Caso o arquivo não exista, aviso o usuário
    console.log(
      "Erro ao ler o arquivo entrada.txt. Cria ele aí na mesma pasta!",
    );

    process.exit(1);
  }

  let rodando = true;

  // Loop principal do menu
  while (rodando) {
    console.clear();

    console.log("--- MENU DE LOGÍSTICA ---");
    console.log("1 - Buscar Cidade pelo CEP");
    console.log("2 - Calcular Frete e Rota");
    console.log("3 - Sair");
    console.log("-------------------------");

    let opc = await rl.question("Digite a opção: ");

    // Opção 1: descobrir cidade pelo CEP
    if (opc === "1") {
      let cep = await rl.question("Qual o CEP? ");
      let cid = buscarCidade(Number(cep), dados.listaCidades);

      if (cid) {
        console.log(`\n>> Esse CEP é da cidade: ${cid}`);
      } else {
        console.log("\n>> CEP não encontrado.");
      }

      // Opção 2: calcular rota
    } else if (opc === "2") {
      let cep1 = await rl.question("CEP de origem: ");
      let cep2 = await rl.question("CEP de destino: ");

      let res = calcularRotaMaisBarata(
        cep1,
        cep2,
        dados.listaCidades,
        dados.grafo,
      );

      if (res.erro) {
        console.log(`\n>> ${res.erro}`);
      } else {
        console.log(`\n>> Saindo de ${res.de} para ${res.para}`);
        console.log(`>> Caminho: ${res.caminho}`);
        console.log(`>> Custo Total: R$ ${res.custo}`);
      }

      // Opção para sair do sistema
    } else if (opc === "3") {
      console.log("Saindo... Valeu!");
      rodando = false;
    } else {
      // Caso o usuário digite algo inválido
      console.log("\nOpção inválida, tenta de novo.");
    }

    if (rodando) {
      await rl.question("\nAperte ENTER para continuar...");
    }
  }

  rl.close();
}

// Aqui é onde o programa realmente começa
rodarSistema();
