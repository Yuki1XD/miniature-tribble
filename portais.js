document.getElementById("menuButton").addEventListener('click', () => {
    document.getElementById('header').classList.toggle('movimentHeader')
    document.getElementById('menuSide').classList.toggle('openMenuSide')
    document.getElementById('contentContainerId').classList.toggle('contentContainer')
})

const buttonTab = document.querySelectorAll('.buttonTab')

buttonTab.forEach(buttonTab => buttonTab.addEventListener('click', () => tabClicked(buttonTab)))

const tabClicked = (buttonTab) => {
    const contentTab = document.querySelectorAll('.contentTab')

    contentTab.forEach(content => content.classList.remove('show'))

    const contentId = buttonTab.getAttribute('content-id') 

    const content = document.getElementById(contentId)

    content.classList.add('show')

    console.log(contentId)
}

const newProjectImg = document.getElementById('newProjectImg')

if (newProjectImg) {
    const spanAddArchive = document.querySelector('.spanAddArchive')
    spanAddArchive.innerHTML = '<i class="fi fi-rr-add-image"></i>Escolha um Arquivo para fazer upload'

    newProjectImg.addEventListener('change', function(e) {

        const inputImg = e.target
        const img = inputImg.files[0]

        if (img) {
            const reader = new FileReader()

            reader.addEventListener('load', function(e) {
                const thisReader = e.target

                const createImg = document.createElement('img')
                createImg.src = thisReader.result
                createImg.classList.add('newAddImg')

                spanAddArchive.innerHTML = ''

                spanAddArchive.appendChild(createImg)

            })

            reader.readAsDataURL(img)
        }
        else {
            spanAddArchive.innerHTML = '<i class="fi fi-rr-add-image"></i>Escolha um Arquivo para fazer upload'
        }

    })
}

// Array global para armazenar todos os arquivos selecionados consecutivamente
let arquivosAcumulados = [];

const newProjectArchives = document.getElementById('newProjectArchives');
const fileListContainer = document.getElementById('fileListContainer');

if (newProjectArchives && fileListContainer) {

    newProjectArchives.addEventListener('change', function(e) {
        // Transforma a FileList do input em um Array nativo
        const novosArquivos = Array.from(e.target.files);

        // Adiciona os novos arquivos ao nosso histórico acumulado
        novosArquivos.forEach(arquivo => {
            // Opcional: evita duplicados com o mesmo nome e tamanho
            const jaExiste = arquivosAcumulados.some(arq => arq.name === arquivo.name && arq.size === arquivo.size);
            if (!jaExiste) {
                arquivosAcumulados.push(arquivo);
            }
        });

        // Atualiza a interface da tela
        renderizarListaArquivos();

        // Limpa o valor do input para que o navegador detecte se o usuário selecionar o mesmo arquivo novamente
        newProjectArchives.value = '';
    });
}

// Função responsável por desenhar os arquivos na tela
function renderizarListaArquivos() {
    fileListContainer.innerHTML = ''; // Limpa a listagem visual anterior

    arquivosAcumulados.forEach((arquivo, index) => {
        const extensao = arquivo.name.split('.').pop().toLowerCase();
        let icone = 'fi-rr-document';

        if (extensao === 'pdf') icone = 'fi-rr-file-pdf';
        else if (['xls', 'xlsx', 'csv'].includes(extensao)) icone = 'fi-rr-file-excel';
        else if (['doc', 'docx'].includes(extensao)) icone = 'fi-rr-file-word';

        // Cria a estrutura do item
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');

        fileItem.innerHTML = `
            <div class="file-item-info">
                <i class="fi ${icone}"></i>
                <span>${arquivo.name}</span>
            </div>
            <button class="remove-file-btn" data-index="${index}">
                <i class="fi fi-rr-trash"></i>
            </button>
        `;

        // Adiciona o evento para remover o arquivo específico da lista caso clique na lixeira
        fileItem.querySelector('.remove-file-btn').addEventListener('click', function(e) {
            const idx = parseInt(this.getAttribute('data-index'));
            arquivosAcumulados.splice(idx, 1); // Remove do array
            renderizarListaArquivos(); // Redesenha a lista atualizada
        });

        fileListContainer.appendChild(fileItem);
    });
}


// JS para a SearchBar

const searchInput = document.querySelector('.searchInput')

searchInput.addEventListener('input', (event) => {

    const value = FormaString(event.target.value)

    const items = document.querySelector(".ProjectAnalizying")

    const noResultsForSearch = document.querySelectorAll('.noResultsForSearch')

    let hasResults = false

    items.forEach(item =>{
        if (FormaString(item.textContent).indexOf(value) !== -1) {
            item.style.display = 'flex'

            let hasResults = true
        }
        else {
            item.style.display = 'none'
        }
    })

    if (noResultsForSearch) {
        if (hasResults) {
            noResultsForSearch.style.display = 'none'
        }
        else {
            noResultsForSearch.style.display = 'block'
        }   
    }
    

})

function FormaString(value) {
    return value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// JS para o Modal

const openModal = document.querySelectorAll('.openModal')

openModal.forEach(button => {
    button.addEventListener('click', () => {
        const modalID = button.getAttribute('data-modal')
        const modal = document.getElementById(modalID)

        modal.showModal() 
    })
})

const closeModal = document.querySelectorAll('.closeModal')

closeModal.forEach(button => {
    button.addEventListener('click', () => {
        const modalID = button.getAttribute('data-modal')
        const modal = document.getElementById(modalID)

        modal.close()
    })
})

// === INTERCEPTAR O ENVIO DO FORMULÁRIO E ENVIAR COM OS ARQUIVOS ACUMULADOS ===

const formAddProject = document.getElementById('formAddProject');

if (formAddProject) {
    formAddProject.addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        const formData = new FormData(formAddProject);

        formData.delete('newProjectArchives');
        
        if (arquivosAcumulados.length === 0) {
            alert('Por favor, adicione ao menos um arquivo ao projeto.');
            return;
        }

        arquivosAcumulados.forEach(arquivo => {
            
            formData.append('newProjectArchives', arquivo);
        });

        fetch('/portal_aluno', {
            method: 'POST',
            body: formData 
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.mensagem || 'Erro ao publicar projeto.');
            }
            return data;
        })
        .then(data => {
            alert('Projeto publicado com sucesso!');
            
            window.location.reload(); 
        })
        .catch(error => {
            console.error('Erro no envio:', error);
            alert(error.message);
        });
    });
}

// FETCH API para adicionar projetos

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('listProjectsTeacher')) {
        loadProjects()
    }
})

async function loadProjects() {
    const container = document.getElementById("listProjectsTeacher")

    const noResultsForSearch = document.querySelector('.noResultsForSearch');
    
    try {

        const response = await fetch('/apis/projetos/pendentes')
        if (!response.ok) throw new Error("Erro ao buscar projetos no servidor")

        const projetos = await response.json()

        if (projetos.length === 0) {
            if (noResultsForSearch) noResultsForSearch.style.display = 'block'
            return
        }

        if (noResultsForSearch) noResultsForSearch.style.display = 'none'

        container.innerHTML = ''

        projetos.forEach(projeto => {

            const projetoCard = document.createElement('div')
            projetoCard.classList.add('ProjectAnalizying')

            const dataFormatada = new Date(projeto.date_project).toLocaleDateString('pt-BR')

            projetoCard.innerHTML = `
                    <img src="/uploads/${projeto.img_project}">

                    <div class="textContentOfProject">

                        <h2>${projeto.name_project}</h2>
                        <p>${projeto.description_project}</p>

                        <div class="pincipalInformationsOfProject">

                            <p>Participantes: ${projeto.creators_project}</p>
                            <p>Turma: TI-2024-B</p>
                            <p>Data: ${projeto.date_project}</p>
                            <div class="youDontAnalisy"><p>${projeto.status_project}</p></div>

                        </div>

                            

                        <button data-modal="modal-${projeto.id_project}" class="openModal">Ver Detalhes</button>

                        <dialog id="modal-${projeto.id_project}" class="modalWindow">

                            <div class="tiitleOfModal">
                                <h1>${projeto.name_project}</h1>
                                <button data-modal="modal-${projeto.id_project}" class="closeModal"><i class="fi-rr-x"></i></button>
                            </div>

                            <div>

                                <div class="listOfContent">

                                    <i class="fi fi-rr-users"></i>

                                    <div>

                                        <p class="listOfContentTittle">Criadores</p>
                                        <p>${projeto.creators_project}</p>

                                    </div>

                                </div>

                                <div class="listOfContent">

                                    <i class="fi fi-rr-calendar"></i>

                                    <div>

                                        <p class="listOfContentTittle">Data de Postagem</p>
                                        <p>${projeto.date_project}</p>

                                    </div>

                                </div>

                                <div class="listOfContent">

                                    <i class="fi fi-rr-document"></i>

                                    <div>

                                        <p class="listOfContentTittle">Categoria</p>
                                        <p>Animal fofo e engraçado</p>

                                    </div>

                                </div>

                                <div class="listOfContent">

                                    <i class="fi fi-rr-users"></i>

                                    <div >

                                        <p class="listOfContentTittle">Turma</p>
                                        <p>TI-2024-B</p>

                                    </div>

                                </div>

                                <div class="listOfContent">

                                    <i class="fi fi-rr-users"></i>

                                    <div>

                                        <p class="listOfContentTittle">Professor Orientador</p>
                                        <p>Machado de Assis</p>

                                    </div>

                                </div>

                                <div class="listOfContent">

                                    <i class="fi fi-rr-tags"></i>

                                    <div class="listTagsForModal">

                                        <p class="listOfContentTittle">Tags</p>

                                        <div class="displayTagModal">

                                            <div class="nameTagForModal"><p>Animal</p></div>
                                            <div class="nameTagForModal"><p>Fofura</p></div>
                                            <div class="nameTagForModal"><p>Engraçado</p></div>

                                        </div>
                                            
                                    </div>

                                </div>

                            </div>

                            <div class="modalDescriptionStatus">

                                <div class="displayTagModalStatus">

                                    <p>Status</p>
                                    <div class="statusOfAnalizy">
                                        <p>${projeto.status_project}</p>
                                    </div>

                                </div>


                                <div>

                                    <p>Descrição:</p>
                                    <p>${projeto.description_project}</p>

                                </div>

                            </div>

                            <div>

                                <h2>Adicionar Analise</h2>

                                <textarea rows="4" wrap="hard" cols="40" class="addAnalizyForProject" maxlength="50" placeholder="Adicione uma analise"></textarea>

                            </div>

                            <button class="sendAnalizy">Enviar Analise</button>
                                

                        </dialog>


                    </div>   
            `
            container.appendChild(projetoCard)
        })

        rebinModalEvents()

    } catch (err) {
        console.error('Erro ao carregar projetos: ', err)
    }
}

function rebinModalEvents() {
    document.querySelectorAll('.openModal').forEach(button => {
        button.onclick = () => {
            const modalID = button.getAttribute('data-modal')
            document.getElementById(modalID).showModal()
        }
    })

    document.querySelectorAll('.closeModal').forEach(button => {
        button.onclick = () => {
            const modalID = button.getAttribute('data-modal')
            document.getElementById(modalID).close()
        }
    })
}
