[35mProjeto-miaudote/src/components/Chat/Chat.jsx[m[36m:[m[32m30[m[36m:[m      const response = await axios.get(`${API_URL}/api/mensagens/usuario/${[1;31muser.id[m}`);
[35mProjeto-miaudote/src/components/Chat/Chat.jsx[m[36m:[m[32m36[m[36m:[m        const outroUsuario = msg.remetente._id === [1;31muser.id[m ? msg.destinatario : msg.remetente;
[35mProjeto-miaudote/src/components/Chat/Chat.jsx[m[36m:[m[32m52[m[36m:[m        remetente: [1;31muser.id[m,
[35mProjeto-miaudote/src/components/Chat/Chat.jsx[m[36m:[m[32m71[m[36m:[m    (msg.remetente._id === [1;31muser.id[m && msg.destinatario._id === usuarioSelecionado?._id) ||
[35mProjeto-miaudote/src/components/Chat/Chat.jsx[m[36m:[m[32m72[m[36m:[m    (msg.remetente._id === usuarioSelecionado?._id && msg.destinatario._id === [1;31muser.id[m)
[35mProjeto-miaudote/src/components/Chat/Chat.jsx[m[36m:[m[32m129[m[36m:[m                      justifyContent: msg.remetente._id === [1;31muser.id[m ? 'flex-end' : 'flex-start',
[35mProjeto-miaudote/src/components/Chat/Chat.jsx[m[36m:[m[32m137[m[36m:[m                        bgcolor: msg.remetente._id === [1;31muser.id[m ? 'primary.main' : 'grey.100',
[35mProjeto-miaudote/src/components/Chat/Chat.jsx[m[36m:[m[32m138[m[36m:[m                        color: msg.remetente._id === [1;31muser.id[m ? 'white' : 'text.primary'
[35mProjeto-miaudote/src/components/EditarPerfil/EditarPerfil.jsx[m[36m:[m[32m99[m[36m:[m      const response = await axios.put(`${API_URL}/api/usuarios/${[1;31muser.id[m}`, formData, {
[35mProjeto-miaudote/src/components/EditarPet/EditarPet.js[m[36m:[m[32m105[m[36m:[m      if (pet.user._id !== [1;31muser.id[m && pet.user !== [1;31muser.id[m) {
[35mProjeto-miaudote/src/components/LoginForm/LoginForm.jsx[m[36m:[m[32m26[m[36m:[m        _id: response.data.[1;31muser.id[m, // ID do MongoDB
[35mProjeto-miaudote/src/pages/Mensagens.jsx[m[36m:[m[32m26[m[36m:[m      const response = await axios.get(`${API_URL}/api/mensagens/usuario/${[1;31muser.id[m}`);
[35mProjeto-miaudote/src/pages/Mensagens.jsx[m[36m:[m[32m31[m[36m:[m  }, [[1;31muser.id[m]); // Adicione [1;31muser.id[m como dependência
[35mProjeto-miaudote/src/pages/Mensagens.jsx[m[36m:[m[32m38[m[36m:[m    msg.destinatario._id === [1;31muser.id[m
[35mProjeto-miaudote/src/pages/Mensagens.jsx[m[36m:[m[32m47[m[36m:[m        remetente: [1;31muser.id[m,
[35mProjeto-miaudote/src/pages/Profile.js[m[36m:[m[32m67[m[36m:[m      fetchUserPets([1;31muser.id[m);
[35mProjeto-miaudote/src/pages/RegisterPet.js[m[36m:[m[32m102[m[36m:[m        formData.append('user', [1;31muser.id[m);
[35mProjeto-miaudote/src/pages/RegisterPet.js[m[36m:[m[32m135[m[36m:[m          user: [1;31muser.id[m,
