### Código para geração do caso de uso UML:

  @startuml
  
  left to right direction
  
  actor "Usuário" as Usuario
  actor "Familiar do paciente" as Familiar
  actor "Médico" as Medico
  
  Familiar --|> Usuario
  Medico --|> Usuario
  
  rectangle "Sistema WebGIS de Serviços de Saúde" {
  
  usecase "Selecionar hospital" as UC1
  usecase "Localizar farmácias\npróximas" as UC2
  usecase "Localizar laboratórios\nde radiografia próximos" as UC3
  usecase "Definir raio de busca" as UC4
  usecase "Filtrar por categoria" as UC5
  usecase "Realizar consulta\nespacial" as UC6
  usecase "Ordenar resultados" as UC7
  usecase "Visualizar resultados\nno mapa" as UC8
  }
  
  Usuario --> UC1
  Usuario --> UC8
  
  Familiar --> UC2
  Medico --> UC3
  
  UC2 ..> UC1 : <<include>>
  UC2 ..> UC4 : <<include>>
  UC2 ..> UC5 : <<include>>
  UC2 ..> UC6 : <<include>>
  UC2 ..> UC7 : <<include>>
  UC2 ..> UC8 : <<include>>
  
  UC3 ..> UC1 : <<include>>
  UC3 ..> UC4 : <<include>>
  UC3 ..> UC5 : <<include>>
  UC3 ..> UC6 : <<include>>
  UC3 ..> UC7 : <<include>>
  UC3 ..> UC8 : <<include>>
  
  @enduml
