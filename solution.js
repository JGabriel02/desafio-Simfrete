const fs = require("fs");
const readline = require("readline/promises");

function processarArquivo(txt) {
  let partes = txt.split("\n--\n");

  // O .filter(l => l.trim() !== '') evita bugar se tiver linha em branco no txt
  let cidadesRaw = partes[0].split("\n").filter((l) => l.trim() !== "");
  let rotasRaw = partes[1].split("\n").filter((l) => l.trim() !== "");

  let listaCidades = cidadesRaw.map((linha) => {
    let [nome, ini, fim] = linha.split(",");
    return { nome, ini: Number(ini), fim: Number(fim) };
  });

  let grafo = {};
  listaCidades.forEach((c) => (grafo[c.nome] = {}));

  rotasRaw.forEach((linha) => {
    let [de, para, valor] = linha.split(",");
    let custo = Number(valor);

    if (!grafo[de][para] || custo < grafo[de][para]) {
      grafo[de][para] = custo;
    }
  });

  return { listaCidades, grafo };
}

// Lógica de achar o CEP
function buscarCidade(cep, listaCidades) {
  let matches = listaCidades.filter((c) => cep >= c.ini && cep <= c.fim);

  if (matches.length === 0) return null;

  // Se tiver mais de uma, desempata pelo menor intervalo
  let cidadeCerta = matches[0];
  let menorTamanho = cidadeCerta.fim - cidadeCerta.ini;

  for (let i = 1; i < matches.length; i++) {
    let tamAtual = matches[i].fim - matches[i].ini;
    if (tamAtual < menorTamanho) {
      menorTamanho = tamAtual;
      cidadeCerta = matches[i];
    }
  }

  return cidadeCerta.nome;
}

// Algoritmo de menor caminho
function calcularRotaMaisBarata(cepOrigem, cepDestino, cidades, grafo) {
  let origem = buscarCidade(Number(cepOrigem), cidades);
  let destino = buscarCidade(Number(cepDestino), cidades);

  if (!origem || !destino)
    return { erro: "CEP não encontrado nas faixas de cidades." };

  let dist = {};
  let anterior = {};
  let visitados = [];

  cidades.forEach((c) => (dist[c.nome] = 9999999));
  dist[origem] = 0;

  // Loop principal da busca
  while (true) {
    let atual = null;
    let menor = 9999999;

    // Pega a cidade com menor custo que ainda não olhamos
    for (let c in dist) {
      if (!visitados.includes(c) && dist[c] < menor) {
        menor = dist[c];
        atual = c;
      }
    }

    if (!atual || atual === destino) break;

    visitados.push(atual);

    for (let vizinho in grafo[atual]) {
      let custoPassandoPorAqui = dist[atual] + grafo[atual][vizinho];

      if (custoPassandoPorAqui < dist[vizinho]) {
        dist[vizinho] = custoPassandoPorAqui;
        anterior[vizinho] = atual; // deixa rastro pra montar a rota depois
      }
    }
  }

  if (dist[destino] === 9999999)
    return { erro: "Rota impossível, sem caminho." };

  let rota = [];
  let noAtual = destino;
  while (noAtual) {
    rota.unshift(noAtual);
    noAtual = anterior[noAtual];
  }

  return {
    de: origem,
    para: destino,
    caminho: rota.join(" -> "),
    custo: dist[destino].toFixed(2),
  };
}

// --- APP PRINCIPAL (MENU) ---
async function rodarSistema() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let dados;

  // Tenta carregar o banco de dados
  try {
    let txt = fs.readFileSync("./entrada.txt", "utf-8");
    dados = processarArquivo(txt);
  } catch (err) {
    console.log(
      "Erro ao ler o arquivo entrada.txt. Cria ele aí na mesma pasta!",
    );
    process.exit(1);
  }

  let rodando = true;

  while (rodando) {
    console.clear();
    console.log("--- MENU DE LOGÍSTICA ---");
    console.log("1 - Buscar Cidade pelo CEP");
    console.log("2 - Calcular Frete e Rota");
    console.log("3 - Sair");
    console.log("-------------------------");

    let opc = await rl.question("Digite a opção: ");

    if (opc === "1") {
      let cep = await rl.question("Qual o CEP? ");
      let cid = buscarCidade(Number(cep), dados.listaCidades);

      if (cid) {
        console.log(`\n>> Esse CEP é da cidade: ${cid}`);
      } else {
        console.log("\n>> CEP não encontrado.");
      }
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
    } else if (opc === "3") {
      console.log("Saindo... Valeu!");
      rodando = false;
    } else {
      console.log("\nOpção inválida, tenta de novo.");
    }

    if (rodando) {
      await rl.question("\nAperte ENTER para continuar...");
    }
  }

  rl.close();
}

// Inicia o script
rodarSistema();
