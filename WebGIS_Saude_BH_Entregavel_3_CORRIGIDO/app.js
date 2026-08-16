// ===============================
// DADOS DO PROTÓTIPO
// ===============================

const hospitais = [
  {
    id: 1,
    nome: "Hospital Municipal de Belo Horizonte",
    lat: -19.9231,
    lng: -43.9378
  },
  {
    id: 2,
    nome: "Hospital Metropolitano BH",
    lat: -19.9177,
    lng: -43.9511
  },
  {
    id: 3,
    nome: "Hospital Central BH",
    lat: -19.9295,
    lng: -43.9418
  }
];

const servicos = [
  { id: 101, nome: "Farmácia Saúde Central", tipo: "farmacia", lat: -19.9219, lng: -43.9365 },
  { id: 102, nome: "Drogaria Minas", tipo: "farmacia", lat: -19.9248, lng: -43.9402 },
  { id: 103, nome: "Farmácia Boa Vida", tipo: "farmacia", lat: -19.9199, lng: -43.9401 },
  { id: 104, nome: "Farmácia Praça Sete", tipo: "farmacia", lat: -19.9237, lng: -43.9344 },
  { id: 105, nome: "Drogaria Horizonte", tipo: "farmacia", lat: -19.9284, lng: -43.9470 },
  { id: 106, nome: "Farmácia Santa Efigênia", tipo: "farmacia", lat: -19.9234, lng: -43.9468 },

  { id: 201, nome: "Radiologia BH Centro", tipo: "radiografia", lat: -19.9206, lng: -43.9398 },
  { id: 202, nome: "Imagem Diagnóstica Minas", tipo: "radiografia", lat: -19.9257, lng: -43.9426 },
  { id: 203, nome: "Centro de Radiografia Savassi", tipo: "radiografia", lat: -19.9330, lng: -43.9360 },
  { id: 204, nome: "Laboratório Imagem Saúde", tipo: "radiografia", lat: -19.9168, lng: -43.9442 },
  { id: 205, nome: "Radioclin BH", tipo: "radiografia", lat: -19.9290, lng: -43.9340 }
];

// ===============================
// ELEMENTOS DA INTERFACE
// ===============================

const hospitalSelect = document.getElementById("hospital");
const categoriaSelect = document.getElementById("categoria");
const raioSelect = document.getElementById("raio");
const ordenacaoSelect = document.getElementById("ordenacao");
const buscarButton = document.getElementById("buscar");
const resultadosDiv = document.getElementById("resultados");
const resumoDiv = document.getElementById("resumo");

// ===============================
// MAPA
// ===============================

const map = L.map("map", {
  center: [-19.9231, -43.9378],
  zoom: 14,
  zoomControl: true
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let hospitalMarker = null;
let searchCircle = null;
let resultMarkers = [];
let resultLines = [];

// ===============================
// FUNÇÕES AUXILIARES
// ===============================

function criarIcone(cor) {
  return L.divIcon({
    className: "custom-map-icon",
    html: `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: ${cor};
        border: 3px solid white;
        box-shadow: 0 1px 5px rgba(0,0,0,.45);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9]
  });
}

function obterHospital() {
  return hospitais.find(
    hospital => hospital.id === Number(hospitalSelect.value)
  );
}

function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000;

  const latitude1 = lat1 * Math.PI / 180;
  const latitude2 = lat2 * Math.PI / 180;

  const deltaLatitude = (lat2 - lat1) * Math.PI / 180;
  const deltaLongitude = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitude1) *
    Math.cos(latitude2) *
    Math.sin(deltaLongitude / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function formatarDistancia(metros) {
  if (metros < 1000) {
    return `${Math.round(metros)} m`;
  }

  return `${(metros / 1000).toFixed(2)} km`;
}

function nomeCategoria(tipo) {
  if (tipo === "farmacia") {
    return "Farmácia";
  }

  return "Laboratório de radiografia";
}

// ===============================
// HOSPITAIS
// ===============================

function carregarHospitais() {
  hospitalSelect.innerHTML = "";

  hospitais.forEach(hospital => {
    const option = document.createElement("option");

    option.value = hospital.id;
    option.textContent = hospital.nome;

    hospitalSelect.appendChild(option);
  });
}

// ===============================
// LIMPEZA DO MAPA
// ===============================

function limparElementosResultados() {
  if (hospitalMarker) {
    map.removeLayer(hospitalMarker);
    hospitalMarker = null;
  }

  if (searchCircle) {
    map.removeLayer(searchCircle);
    searchCircle = null;
  }

  resultMarkers.forEach(marker => {
    map.removeLayer(marker);
  });

  resultLines.forEach(line => {
    map.removeLayer(line);
  });

  resultMarkers = [];
  resultLines = [];
}

// ===============================
// HOSPITAL + ÁREA DE BUSCA
// ===============================

function desenharReferencia() {
  const hospital = obterHospital();
  const raio = Number(raioSelect.value);

  limparElementosResultados();

  hospitalMarker = L.marker(
    [hospital.lat, hospital.lng],
    {
      icon: criarIcone("#d62828")
    }
  ).addTo(map);

  hospitalMarker.bindPopup(`
    <strong>${hospital.nome}</strong><br>
    Hospital de referência
  `);

  searchCircle = L.circle(
    [hospital.lat, hospital.lng],
    {
      radius: raio,
      color: "#176b87",
      fillColor: "#176b87",
      fillOpacity: 0.10,
      weight: 2
    }
  ).addTo(map);

  searchCircle.bindPopup(`
    <strong>Área de consulta espacial</strong><br>
    Raio: ${formatarDistancia(raio)}
  `);

  map.setView(
    [hospital.lat, hospital.lng],
    15
  );
}

// ===============================
// CONSULTA ESPACIAL
// ===============================

function realizarConsulta() {
  const hospital = obterHospital();
  const raio = Number(raioSelect.value);
  const categoria = categoriaSelect.value;
  const ordenacao = ordenacaoSelect.value;

  // Desenha o hospital e o raio.
  desenharReferencia();

  // Primeiro calcula a distância de todos os serviços.
  let encontrados = servicos.map(servico => {
    return {
      ...servico,
      distancia: distanciaMetros(
        hospital.lat,
        hospital.lng,
        servico.lat,
        servico.lng
      )
    };
  });

  // Consulta espacial:
  // "estabelecimento está contido no raio?"
  encontrados = encontrados.filter(
    servico => servico.distancia <= raio
  );

  // Filtro por categoria.
  if (categoria !== "todos") {
    encontrados = encontrados.filter(
      servico => servico.tipo === categoria
    );
  }

  // Ordenação.
  if (ordenacao === "distancia") {
    encontrados.sort(
      (a, b) => a.distancia - b.distancia
    );
  } else {
    encontrados.sort(
      (a, b) => a.nome.localeCompare(
        b.nome,
        "pt-BR",
        { sensitivity: "base" }
      )
    );
  }

  atualizarResumo(encontrados, raio);
  mostrarResultadosNoMapa(encontrados, hospital);
  mostrarLista(encontrados);
}

// ===============================
// RESUMO
// ===============================

function atualizarResumo(encontrados, raio) {
  resumoDiv.textContent =
    `${encontrados.length} estabelecimento(s) encontrado(s) em até ${formatarDistancia(raio)}.`;
}

// ===============================
// RESULTADOS NO MAPA
// ===============================

function mostrarResultadosNoMapa(encontrados, hospital) {
  encontrados.forEach(servico => {
    const cor =
      servico.tipo === "farmacia"
        ? "#176b87"
        : "#2a9d55";

    const marker = L.marker(
      [servico.lat, servico.lng],
      {
        icon: criarIcone(cor)
      }
    ).addTo(map);

    marker.bindPopup(`
      <strong>${servico.nome}</strong><br>
      ${nomeCategoria(servico.tipo)}<br>
      Distância: ${formatarDistancia(servico.distancia)}
    `);

    resultMarkers.push(marker);

    // Linha representando a relação espacial hospital -> serviço.
    const line = L.polyline(
      [
        [hospital.lat, hospital.lng],
        [servico.lat, servico.lng]
      ],
      {
        color: "#555",
        weight: 2,
        opacity: 0.65,
        dashArray: "5, 6"
      }
    ).addTo(map);

    resultLines.push(line);
  });
}

// ===============================
// LISTA
// ===============================

function mostrarLista(encontrados) {
  resultadosDiv.innerHTML = "";

  if (encontrados.length === 0) {
    resultadosDiv.innerHTML = `
      <div class="vazio">
        Nenhum estabelecimento encontrado dentro do raio
        com os filtros selecionados.
      </div>
    `;

    return;
  }

  encontrados.forEach(servico => {
    const resultado = document.createElement("div");

    resultado.className = "resultado";

    resultado.innerHTML = `
      <div class="nome">${servico.nome}</div>
      <div class="tipo">${nomeCategoria(servico.tipo)}</div>
      <div class="distancia">
        ${formatarDistancia(servico.distancia)}
      </div>
    `;

    resultado.addEventListener("click", () => {
      const marker = resultMarkers.find(
        item => {
          const position = item.getLatLng();

          return (
            Math.abs(position.lat - servico.lat) < 0.000001 &&
            Math.abs(position.lng - servico.lng) < 0.000001
          );
        }
      );

      map.setView(
        [servico.lat, servico.lng],
        17
      );

      if (marker) {
        marker.openPopup();
      }
    });

    resultadosDiv.appendChild(resultado);
  });
}

// ===============================
// EVENTOS DOS FILTROS
// ===============================

buscarButton.addEventListener(
  "click",
  realizarConsulta
);

hospitalSelect.addEventListener(
  "change",
  realizarConsulta
);

categoriaSelect.addEventListener(
  "change",
  realizarConsulta
);

raioSelect.addEventListener(
  "change",
  realizarConsulta
);

ordenacaoSelect.addEventListener(
  "change",
  realizarConsulta
);

// ===============================
// INICIALIZAÇÃO
// ===============================

carregarHospitais();
realizarConsulta();

// O Leaflet precisa saber o tamanho real do container.
// Isso evita o mapa aparecer quebrado quando a página termina de carregar.
setTimeout(() => {
  map.invalidateSize();
}, 200);

window.addEventListener("resize", () => {
  map.invalidateSize();
});
