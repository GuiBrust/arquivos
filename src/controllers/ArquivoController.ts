import { Db, GridFSBucket, ObjectID, ObjectId } from "mongodb"
import { join } from 'path'
import { exec } from 'child_process'
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'

export enum ErroUpload {
    OBJETO_ARQUIVO_INVALIDO = 'Objeto de arquivo inválido',
    NAO_FOI_POSSIVEL_GRAVAR = 'Não foi possível gravar o arquivo no banco de dados'
}

export class ArquivoController {
    private _bd: Db
    private _caminhoDiretorioArquivos: string

    constructor(bd: Db) {
        this._bd = bd
        this._caminhoDiretorioArquivos = join(__dirname, '..', '..', 'arquivos_temporarios')
        if (!existsSync(this._caminhoDiretorioArquivos)) {
            mkdirSync(this._caminhoDiretorioArquivos)
        }
    }

    private _valido(objArquivo: any): boolean {
        return objArquivo
            && 'name' in objArquivo
            && 'data' in objArquivo
            && objArquivo['name']
            && objArquivo['data']
    }

    private _inicializarBucket(): GridFSBucket {
        return new GridFSBucket(this._bd, {
            bucketName: 'arquivos'
        })
    }

    realizarUpload(objArquivo: any): Promise<ObjectId> {
        return new Promise((resolve, reject) => {
            if (this._valido(objArquivo)) {
                const bucket = this._inicializarBucket()

                const nomeArquivo = objArquivo['name']
                const conteudoArquivo = objArquivo['data']
                const nomeArquivoTemp = `${nomeArquivo}_${(new Date().getTime())}`
                let aux = nomeArquivo.substring(0, nomeArquivo.length - 3) + 'cer'

                const caminhoArquivoTemp = join(this._caminhoDiretorioArquivos, nomeArquivoTemp)
                writeFileSync(caminhoArquivoTemp, conteudoArquivo)//escreve arquivo na pasta
                exec(`cd arquivos_temporarios && openssl pkcs7 --print_certs --in ${nomeArquivoTemp} --inform der --outform pem --out ${aux}`)

                const streamGridFS = bucket.openUploadStream(aux)

                aux = join(this._caminhoDiretorioArquivos, aux)
                console.log(aux)
                const streamLeitura = createReadStream(aux)
                streamLeitura
                    .pipe(streamGridFS)
                    .on('finish', () => {
                        //unlinkSync(caminhoArquivoTemp)//apaga o arquivo depois que gravou
                        resolve(new ObjectId(`${streamGridFS.id}`))
                    })
                    .on('error', erro => {
                        console.log(ErroUpload.NAO_FOI_POSSIVEL_GRAVAR)
                    })
            } else {
                reject(ErroUpload.OBJETO_ARQUIVO_INVALIDO)
            }
        })

    }
}