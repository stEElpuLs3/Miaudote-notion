const mongoose = require('mongoose');

// Coordenadas em formato GeoJSON, num schema separado.
// O "default: undefined" la embaixo e o ponto central: sem ele, o Mongoose
// cria o objeto de localizacao mesmo quando o geocoding falha, e o pet vai
// parar em [0, 0] — no meio do Atlantico, invisivel para qualquer busca.
const PontoSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (valor) =>
          Array.isArray(valor) &&
          valor.length === 2 &&
          valor[0] >= -180 && valor[0] <= 180 &&
          valor[1] >= -90 && valor[1] <= 90,
        message: 'coordinates precisa ser [longitude, latitude] dentro dos limites do globo'
      }
    }
  },
  { _id: false }
);

const PetSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    especie: { type: String, required: true, trim: true },
    raca: { type: String, trim: true },
    idade: { type: Number, min: 0, max: 30 },
    descricao: { type: String, trim: true },
    fotos: [String],

    // required: true impede que um pet nasca sem dono, como aconteceu
    // com os registros de 09/08 que precisaram ser apagados na mao.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    endereco: {
      cep: String,
      rua: String,
      numero: String,
      bairro: String,
      cidade: String,
      estado: String
    },

    // Sem valor padrao: pet sem coordenada fica fora do indice e fora da
    // busca por proximidade, em vez de aparecer como se estivesse na Africa.
    localizacao: {
      type: PontoSchema,
      default: undefined
    },

    status: {
      type: String,
      enum: ['disponivel', 'adotado'],
      default: 'disponivel'
    }
  },
  { timestamps: true }
);

// Indice geoespacial exigido pelo $near da rota /api/pets/proximidade (RNF04).
// sparse: documentos sem localizacao simplesmente nao entram no indice.
PetSchema.index({ localizacao: '2dsphere' }, { sparse: true });

// Acelera a lista de pets do perfil e o filtro por especie.
PetSchema.index({ user: 1, createdAt: -1 });
PetSchema.index({ status: 1, especie: 1 });

module.exports = mongoose.model('Pet', PetSchema);