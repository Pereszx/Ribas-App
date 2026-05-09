🏗️ Ribas Manutenção App
<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
</p>
<p align="center">
  Aplicativo móvel de gestão de manutenção de frota e documentos de RH desenvolvido para a <strong>Guindastes Ribas Ltda.</strong>, empresa de locação e operação de guindastes sediada em São José dos Pinhais — PR.
</p>

📱 Sobre o projeto
O Ribas Manutenção App foi desenvolvido como projeto da disciplina Jornada de Aprendizagem — Redes e Mobilidade Inteligente do curso de Engenharia de Software (5º período).
A solução digitaliza e centraliza:

O controle de manutenções preventivas e corretivas da frota
O registro fotográfico de avarias com rastreabilidade
A gestão documental dos colaboradores (exames, atestados)
O acesso rápido a fichas de veículos via QR Code


✨ Funcionalidades
👨‍💼 Administrador

 Login e autenticação com perfil ADM
 Dashboard com resumo da frota e alertas
 Cadastro de veículos (guindastes, caminhões, veículos)
 Geração de QR Code único por veículo
 Agendamento de manutenções preventivas
 Visualização de histórico de manutenções e relatórios
 Módulo RH — controle de exames admissionais e atestados
 Alertas de vencimento de documentos (push + painel)
 Gerenciamento de funcionários

👷 Funcionário

 Login com perfil restrito
 Scanner de QR Code para acesso à ficha do veículo
 Registro de ocorrências e relatórios com foto
 Visualização dos próprios documentos (exames e atestados)


🛠️ Stack tecnológica
Camada Tecnologia Frontend MobileReact Native + Expo (Android & iOS) Linguagem: TypeScript, Autenticação: Firebase Auth (e-mail/senha + JWT), Banco de dados: Cloud Firestore (NoSQL), Armazenamento: Firebase Storage (fotos e documentos), Notificações: Firebase Cloud Messaging (FCM)QR Codeexpo-camera + react-native-qrcode-svg NavegaçãoReact Navigation (Stack + Bottom Tabs)
