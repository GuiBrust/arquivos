import { Router } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import { exec } from 'child_process'

export const uploadRouter = Router()

uploadRouter.post('/', (req, res) => {
    if (!req.files || Object.keys(req.files).length == 0) {
        return res.status(404).send('Nenhum arquivo recebido')
    }

    const nomesArquivos = Object.keys(req.files)
    const diretorio = path.join(__dirname, '..', '..', 'arquivos')
    if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio)
    }

    nomesArquivos.forEach(arquivo => {
        const objArquivo = req.files[arquivo]
        const nomeArquivo = objArquivo['name']
        const conteudoArquivo = objArquivo['data']

        const caminhoArquivo = path.join(diretorio, nomeArquivo)
        
        fs.writeFileSync(caminhoArquivo, conteudoArquivo)
        exec('cd arquivos && openssl pkcs7 --print_certs --in pe-nfe.p7b --inform der --outform pem --out PE-NFE.cer')
        
    })

    res.send('Arquivos gravados no servidor')
})