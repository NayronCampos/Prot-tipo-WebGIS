const map = L.map("map").setView(
    [-19.9167, -43.9345],
    13
);


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,

        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }
).addTo(map);


let userMarker = null;

let userCircle = null;

let placeMarkers = [];

let todosOsLocais = [];

let localAtual = null;


const statusEl =
    document.getElementById("status");

const resultadosEl =
    document.getElementById("resultados");

const contadorEl =
    document.getElementById("contador");


function setStatus(texto) {

    statusEl.textContent = texto;

}


/*
    Calcula a distância entre
    dois pontos geográficos.
*/
function distanciaMetros(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const rad = Math.PI / 180;

    const dLat =
        (lat2 - lat1) * rad;

    const dLon =
        (lon2 - lon1) * rad;


    const a =
        Math.sin(dLat / 2) ** 2 +

        Math.cos(lat1 * rad) *
        Math.cos(lat2 * rad) *
        Math.sin(dLon / 2) ** 2;


    return R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

}


/*
    Formata a distância
*/
function formatarDistancia(
    metros
) {

    if (metros < 1000) {

        return `${Math.round(metros)} m`;

    }

    return `${(
        metros / 1000
    ).toFixed(1).replace(".", ",")} km`;

}


/*
    Cria os ícones do mapa
*/
function criarIcone(classe) {

    return L.divIcon({

        className: "",

        html:
            `<div class="${classe}"
             style="width:16px;height:16px;">
             </div>`,

        iconSize: [16, 16],

        iconAnchor: [8, 8]

    });

}


/*
    Remove marcadores antigos
*/
function limparMarcadores() {

    placeMarkers.forEach(
        marker => map.removeLayer(marker)
    );

    placeMarkers = [];

}


/*
    Mostra a localização
    do usuário
*/
function mostrarLocalUsuario(
    lat,
    lon
) {

    if (userMarker) {

        map.removeLayer(userMarker);

    }


    if (userCircle) {

        map.removeLayer(userCircle);

    }


    userMarker = L.marker(
        [lat, lon],
        {
            icon:
                criarIcone("user-marker")
        }
    ).addTo(map);


    userMarker.bindPopup(
        "<b>Você está aqui</b>"
    );


    userCircle = L.circle(
        [lat, lon],
        {
            radius:
                Number(
                    document.getElementById(
                        "raio"
                    ).value
                ),

            fillOpacity: 0.05,

            weight: 1
        }
    ).addTo(map);

}


/*
    Consulta o OpenStreetMap
    através do Overpass
*/
async function buscarEstabelecimentos(
    lat,
    lon
) {

    const raio =
        Number(
            document.getElementById(
                "raio"
            ).value
        );


    setStatus(
        "Buscando farmácias e laboratórios..."
    );


    const query = `
[out:json][timeout:25];

(
  nwr["amenity"="pharmacy"]
      (around:${raio},${lat},${lon});

  nwr["healthcare"="laboratory"]
      (around:${raio},${lat},${lon});

  nwr["healthcare"="pharmacy"]
      (around:${raio},${lat},${lon});
);

out center tags;
`;


    const url =
        "https://overpass-api.de/api/interpreter";


    try {

        const resposta =
            await fetch(
                url,
                {
                    method: "POST",

                    body: query
                }
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro na consulta."
            );

        }


        const dados =
            await resposta.json();


        todosOsLocais =
            dados.elements

                .map(elemento => {

                    const latLocal =
                        elemento.lat ??
                        elemento.center?.lat;


                    const lonLocal =
                        elemento.lon ??
                        elemento.center?.lon;


                    if (
                        !Number.isFinite(Number(latLocal)) ||
                        !Number.isFinite(Number(lonLocal))
                    ) {

                        return null;

                    }


                    const tags =
                        elemento.tags || {};


                    const tipo =
                        identificarTipo(
                            tags
                        );


                    return {

                        id:
                            elemento.type +
                            "-" +
                            elemento.id,

                        nome:
                            obterNomeEstabelecimento(
                                tags
                            ),

                        tipo,

                        latitude:
                            latLocal,

                        longitude:
                            lonLocal,

                        endereco:
                            montarEndereco(
                                tags
                            ),

                        distancia:
                            distanciaMetros(
                                lat,
                                lon,
                                latLocal,
                                lonLocal
                            )

                    };

                })

                .filter(Boolean)

                .filter(local =>
                    local.nome !== "Estabelecimento sem nome"
                )

                .filter((local, indice, locais) =>
                    locais.findIndex(outro =>
                        outro.id === local.id
                    ) === indice
                )

                .sort(
                    (a, b) =>
                        a.distancia -
                        b.distancia
                );


        aplicarFiltros();


        setStatus(
            `${todosOsLocais.length}
             estabelecimento(s)
             encontrado(s).`
        );


    } catch (erro) {

        console.error(erro);


        setStatus(
            "Erro ao buscar dados. Tente novamente."
        );


        resultadosEl.innerHTML =
            `<div class="empty">
                Não foi possível carregar
                os estabelecimentos.
             </div>`;


        contadorEl.textContent = "0";

    }

}


/*
    Identifica o tipo
*/
function identificarTipo(tags) {

    if (
        tags.amenity === "pharmacy" ||
        tags.healthcare === "pharmacy"
    ) {

        return "farmacia";

    }


    return "laboratorio";

}


/*
    Usa o nome principal antes de recorrer
    a marca ou operador cadastrados no OSM.
*/
function obterNomeEstabelecimento(tags) {

    return tags.name ||
        tags["name:pt"] ||
        tags.official_name ||
        tags.brand ||
        tags.operator ||
        "Estabelecimento sem nome";

}


/*
    Monta endereço
*/
function montarEndereco(tags) {

    const partes = [];


    if (tags["addr:street"]) {

        partes.push(
            tags["addr:street"]
        );

    }


    if (tags["addr:housenumber"]) {

        partes.push(
            tags["addr:housenumber"]
        );

    }


    if (tags["addr:suburb"]) {

        partes.push(
            tags["addr:suburb"]
        );

    }


    if (tags["addr:city"]) {

        partes.push(
            tags["addr:city"]
        );

    }

    if (tags["addr:postcode"]) {

        partes.push(
            tags["addr:postcode"]
        );

    }


    if (partes.length > 0) {

        return partes.join(", ");

    }


    return "Endereço não informado";

}


/*
    Nome amigável do tipo
*/
function nomeTipo(tipo) {

    if (tipo === "farmacia") {

        return "Farmácia";

    }


    return "Laboratório";

}


/*
    Aplica os filtros
*/
function aplicarFiltros() {

    const tipoSelecionado =
        document.getElementById(
            "tipo"
        ).value;


    const raio =
        Number(
            document.getElementById(
                "raio"
            ).value
        );


    const locaisFiltrados =
        todosOsLocais.filter(
            local => {

                const tipoOk =
                    tipoSelecionado ===
                    "todos" ||
                    local.tipo ===
                    tipoSelecionado;


                const distanciaOk =
                    local.distancia <=
                    raio;


                return (
                    tipoOk &&
                    distanciaOk
                );

            }
        );


    exibirResultados(
        locaisFiltrados
    );

}


/*
    Exibe os resultados
*/
function exibirResultados(
    locais
) {

    limparMarcadores();


    contadorEl.textContent =
        locais.length;


    if (locais.length === 0) {

        resultadosEl.innerHTML =
            `<div class="empty">
                Nenhum estabelecimento
                encontrado.
             </div>`;

        return;

    }


    resultadosEl.innerHTML = "";


    locais.forEach(local => {

        const marker =
            L.marker(
                [
                    local.latitude,
                    local.longitude
                ],
                {
                    icon:
                        criarIcone(
                            "place-marker"
                        )
                }
            ).addTo(map);


        /*
            Link para o Google Maps.
            Não utiliza API_KEY.
        */
        const googleMapsUrl =
            `https://www.google.com/maps/search/?api=1&query=${local.latitude},${local.longitude}`;


        marker.bindPopup(`

            <b>
                ${escaparHtml(local.nome)}
            </b>

            <br>

            ${nomeTipo(local.tipo)}

            <br>

            ${escaparHtml(
                local.endereco
            )}

            <br>

            <b>
                ${formatarDistancia(
                    local.distancia
                )}
            </b>

            <br><br>

            <a
                href="${googleMapsUrl}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Abrir no Google Maps
            </a>

        `);


        placeMarkers.push(marker);


        const div =
            document.createElement(
                "div"
            );


        div.className =
            "result";


        div.innerHTML = `

            <h3>
                ${escaparHtml(
                    local.nome
                )}
            </h3>

            <p>
                ${nomeTipo(
                    local.tipo
                )}
            </p>

            <p>
                ${escaparHtml(
                    local.endereco
                )}
            </p>

            <p class="distance">
                📏
                ${formatarDistancia(
                    local.distancia
                )}
            </p>

            <a
                href="${googleMapsUrl}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Abrir no Google Maps →
            </a>

        `;


        div.addEventListener(
            "click",
            () => {

                map.setView(
                    [
                        local.latitude,
                        local.longitude
                    ],
                    17
                );


                marker.openPopup();

            }
        );


        resultadosEl.appendChild(
            div
        );

    });

}


/*
    Evita inserir HTML
    vindo dos dados externos.
*/
function escaparHtml(texto) {

    return String(texto)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/*
    Pesquisa endereço usando
    Nominatim/OpenStreetMap.
*/
async function buscarEndereco() {

    const endereco =
        document.getElementById(
            "endereco"
        ).value.trim();


    if (!endereco) {

        setStatus(
            "Digite um endereço."
        );

        return;

    }


    setStatus(
        "Localizando endereço..."
    );


    const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=jsonv2" +
        "&limit=1" +
        "&accept-language=pt-BR" +
        "&q=" +
        encodeURIComponent(
            endereco
        );


    try {

        const resposta =
            await fetch(url);


        const dados =
            await resposta.json();


        if (!dados.length) {

            setStatus(
                "Endereço não encontrado."
            );

            return;

        }


        const lat =
            Number(
                dados[0].lat
            );


        const lon =
            Number(
                dados[0].lon
            );


        definirLocal(
            lat,
            lon,
            dados[0].display_name
        );


    } catch (erro) {

        console.error(erro);


        setStatus(
            "Erro ao pesquisar o endereço."
        );

    }

}


/*
    Define o ponto central
    da pesquisa.
*/
function definirLocal(
    lat,
    lon,
    descricao
) {

    localAtual = {
        lat,
        lon
    };


    map.setView(
        [lat, lon],
        15
    );


    mostrarLocalUsuario(
        lat,
        lon
    );


    setStatus(
        `Local selecionado: ${descricao}`
    );


    buscarEstabelecimentos(
        lat,
        lon
    );

}


/*
    Obtém localização do navegador.
*/
function obterLocalizacao() {

    if (
        !navigator.geolocation
    ) {

        setStatus(
            "Seu navegador não suporta geolocalização."
        );

        return;

    }


    setStatus(
        "Obtendo sua localização..."
    );


    navigator.geolocation.getCurrentPosition(

        posicao => {

            const lat =
                posicao.coords.latitude;


            const lon =
                posicao.coords.longitude;


            definirLocal(
                lat,
                lon,
                "Sua localização atual"
            );

        },


        erro => {

            console.error(erro);


            setStatus(
                "Não foi possível obter sua localização."
            );

        },


        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 60000
        }

    );

}


/*
    Botão de localização
*/
document
    .getElementById(
        "btnLocalizacao"
    )
    .addEventListener(
        "click",
        obterLocalizacao
    );


/*
    Botão de pesquisa
*/
document
    .getElementById(
        "btnBuscar"
    )
    .addEventListener(
        "click",
        buscarEndereco
    );


/*
    Botão de filtro
*/
document
    .getElementById(
        "btnFiltrar"
    )
    .addEventListener(
        "click",
        () => {

            if (localAtual) {

                mostrarLocalUsuario(
                    localAtual.lat,
                    localAtual.lon
                );


                buscarEstabelecimentos(
                    localAtual.lat,
                    localAtual.lon
                );

            } else {

                aplicarFiltros();

            }

        }
    );


/*
    Enter na pesquisa
*/
document
    .getElementById(
        "endereco"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                buscarEndereco();

            }

        }
    );


/*
    Atualiza círculo
*/
document
    .getElementById(
        "raio"
    )
    .addEventListener(
        "change",
        () => {

            if (localAtual) {

                mostrarLocalUsuario(
                    localAtual.lat,
                    localAtual.lon
                );

            }

        }
    );