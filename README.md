# Webhook para Donaciones Ko-fi y Notificaciones en Telegram

Este proyecto permite recibir notificaciones de donaciones realizadas a través de **Ko-fi** y enviar mensajes automáticamente a un **chat de Telegram**. Además, actualiza un archivo **Gist** con la información de los donantes para llevar un registro de las donaciones.

## 📦 Requisitos

Para ejecutar este proyecto necesitas tener instaladas las siguientes dependencias:

- **Node.js** (versión 12.x o superior)
- **npm** (gestor de paquetes de Node.js)

### Dependencias

Este proyecto usa las siguientes dependencias que debes instalar:

```bash
npm install express serverless-http body-parser request @octokit/core winston
```
---
## 🚀 ¿Cómo usarlo?
1. Clona el repositorio:
```bash
git clone https://github.com/tuusuario/kofi-webhook.git
cd kofi-webhook
```
2. Crea las variables de entorno necesarias
Necesitarás configurar algunas variables de entorno para que el proyecto funcione correctamente. Estas variables deben ser definidas en tu entorno de ejecución:

> TELEGRAM_BOT_TOKEN: Token de tu bot de Telegram.
> 
> TELEGRAM_CHAT_ID: ID del chat de Telegram al que se enviarán las notificaciones.
> 
> KOFI_TOKEN: Token de verificación de Ko-fi.
> 
> KOFI_USERNAME: Nombre de usuario en Ko-fi.
> 
> GIST_URL: URL de tu Gist de GitHub donde se almacenarán las donaciones.
> 
> GIST_TOKEN: Token de acceso personal para GitHub.
> 

3. Ejecuta el proyecto:
```bash
npm start
```
El servidor escuchará las solicitudes POST que provengan del webhook de Ko-fi y procesará los pagos y actualizaciones.

---

## 🛠️ ¿Qué hace este proyecto?
Recibe un webhook de Ko-fi cada vez que se realiza una donación.

Verifica los datos del webhook para asegurarse de que provienen de Ko-fi.

Envia una notificación al canal de Telegram configurado, con los detalles de la donación.

Actualiza un Gist de GitHub con la información de los donantes.

Registra eventos de error y éxito utilizando el módulo winston para mejorar la trazabilidad.

🌐 Endpoints
Este proyecto expone un único endpoint que recibirá solicitudes POST con los datos del webhook de Ko-fi:

```bash
POST / (Raíz del servidor)
```
El cuerpo de la solicitud debe contener los siguientes datos:

data: un objeto JSON con los detalles de la donación.

## ⚠️ Advertencia
Este proyecto actualiza automáticamente el Gist con la información de los donantes cada vez que se recibe una nueva donación. Asegúrate de tener configurado correctamente tu Gist y de manejar las credenciales con seguridad.
