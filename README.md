# Dropbox Sign Node Example
This TypeScript console app can be used to download all of your documents from Dropbox Sign.

> [!NOTE]
> This app uses the official [Dropbox Sign Node SDK](https://github.com/hellosign/dropbox-sign-node)

Be mindful of the prompts as your answers will affect results:
* You will be asked to select between downloading just **your** documents or **all** documents for your team – if you are part of a team.
* You will have the option to select between downloading PDF or ZIP files.

Additionally:
* A `files` directory will be created in the root folder of this project.
* The file name of each file will default to its corresponding signature request ID, e.g. 4844301d4f601c87e77d1da7b039393ae18bb0c3.pdf.
* Existing files with matching file names will be overwritten.

> [!IMPORTANT]
> **Depending on the amount of total files, this process may take some time.**


## How to use

### Install dependencies:
```
npm install
```

### Set up environment variables:
Create a new file named `.env` in the root folder of this project and add your Dropbox Sign `API_KEY`.

### Run the app:
```
npm start
```