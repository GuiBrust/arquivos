import { Router } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import { ArquivoController, ErroUpload } from '../controllers/ArquivoController'

export const uploadRouter = Router()

uploadRouter.post('/', async (req, res) => {
    if (!req.files || Object.keys(req.files).length == 0) {
        return res.status(404).send('Nenhum arquivo recebido')
    }

    const nomesArquivos = Object.keys(req.files)
    const diretorio = path.join(__dirname, '..', '..', 'arquivos')
    if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio)
    }

    const bd = req.app.locals.bd
    const arquivoCtrl = new ArquivoController(bd)
    const idsArquivosSalvos = []
    let erroGrvacao = 0
    let erroObjArquivoInvalido = 0
    let erroInesperado = 0

    const promise = nomesArquivos.map(async (arquivo) => {
        const objArquivo = req.files[arquivo]
        try {
            const idArquivo = await arquivoCtrl.realizarUpload(objArquivo)
            idsArquivosSalvos.push(idArquivo)
        } catch (erro) {
            switch (erro) {
                case ErroUpload.NAO_FOI_POSSIVEL_GRAVAR:
                    erroGrvacao++
                    break
                case ErroUpload.OBJETO_ARQUIVO_INVALIDO:
                    erroObjArquivoInvalido++
                    break
                default:
                    erroInesperado++
            }
        }
    })

    await Promise.all(promise)
    res.json({
        idsArquivosSalvos
    })
})