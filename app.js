let currentStep = 0;

function startRegistration(){

    document.getElementById(
        "welcomeScreen"
    ).style.display = "none";

    document.getElementById(
        "registrationScreen"
    ).style.display = "flex";

    renderStep();

    updateNavigation();
}

let questionnaire = {};

//renderStep();
//updateNavigation();

function showLoading(){

    document.getElementById(
        "loadingOverlay"
    ).style.display = "flex";
}

function hideLoading(){

    document.getElementById(
        "loadingOverlay"
    ).style.display = "none";
}

function renderStep(){

    updateNavigation();

    const container =
        document.getElementById(
            "questionContainer"
        );

    container.innerHTML = "";

    const step =
        portalSteps[currentStep];

    const pct =
        Math.round(
            ((currentStep + 1)
            /
            portalSteps.length)
            * 100
        );

    document.getElementById(
        "progressBar"
    ).style.width =
    pct + "%";

    document.getElementById(
        "percent"
    ).innerHTML =
    pct + "%";

    if(
        step.title ===
        "Review & Submit"
    ){
        renderReview();
        return;
    }

    step.questions.forEach(q=>{

        let html =

        `<div class="question-card">

        <label>

        ${q.label}

        ${
            q.required
            ?
            '<span class="required-star">*</span>'
            :
            ''
        }

        </label>`;

        if(q.type==="text"){

            const value =
            questionnaire[q.id] || "";

            html += `
            <input
            class="form-control"
            id="${q.id}"
            value="${value}">
            `;
        }

        if(q.type==="dropdown"){

            html += `
            <select
            class="form-select"
            id="${q.id}">
            `;

            q.options.forEach(option => {

                const selected =
                questionnaire[q.id] === option
                ? "selected"
                : "";

                html += `
                <option
                ${selected}>
                ${option}
                </option>`;
            });

            html += `</select>`;
        }

     if(q.type==="file"){

    html += `

    <div class="upload-zone">

        <input
        type="file"
        multiple
        id="${q.id}"
        class="form-control">

    </div>

    `;
}

        html += `</div>`;

        container.innerHTML += html;

    });

}

function updateNavigation(){

    const sidebar =
    document.getElementById(
        "sidebarNavigation"
    );

    if(!sidebar){
        return;
    }

    let html = "";

    portalSteps.forEach(
    (step,index)=>{

        let cls = "nav-item";

        if(index === currentStep){

            cls += " active";
        }

        if(index < currentStep){

            cls += " completed";
        }

        html += `

        <div class="${cls}">

            ${
                index < currentStep

                ? "✓ "

                : index === currentStep

                ? "► "

                : "○ "
            }

            ${step.title}

        </div>

        `;
    });

    sidebar.innerHTML = html;
}

function saveCurrentStep(){

    const step =
    portalSteps[currentStep];

    step.questions.forEach(q=>{

        const control =
        document.getElementById(
            q.id
        );

        if(!control){
            return;
        }

        if(q.type==="file"){

    questionnaire[q.id] = [];

    for(
        let i = 0;
        i < control.files.length;
        i++
    ){

        questionnaire[q.id].push(
            control.files[i]
        );
    }
}
        else{

            questionnaire[q.id] =
            control.value;
        }

    });

}

function validateStep(){

    const step =
    portalSteps[currentStep];

    let valid = true;

    step.questions.forEach(q=>{

        const control =
        document.getElementById(
            q.id
        );

        if(!control){
            return;
        }

        if(q.required){

            if(q.type==="file"){

                if(
                    control.files.length === 0
                ){

                    valid = false;

                    control.classList.add(
                        "error-border"
                    );
                }
                else{

                    control.classList.remove(
                        "error-border"
                    );
                }
            }
            else{

                if(
                    control.value.trim() === ""
                ){

                    valid = false;

                    control.classList.add(
                        "error-border"
                    );
                }
                else{

                    control.classList.remove(
                        "error-border"
                    );
                }
            }
        }

    });

    return valid;
}

function nextStep(){

    if(!validateStep()){

        alert(
            "Please complete all required fields."
        );

        return;
    }

    saveCurrentStep();

    if(
        currentStep <
        portalSteps.length - 1
    ){

        currentStep++;

        renderStep();
    }
}

function previousStep(){

    saveCurrentStep();

    if(currentStep > 0){

        currentStep--;

        renderStep();
    }
}

function renderReview(){

    let html = `

    <div class="review-card">

    <h3>
    Review Your Submission
    </h3>

    `;

    Object.keys(
        questionnaire
    ).forEach(key=>{

        html += `

        <div class="review-row">

            <strong>

            ${key}

            </strong>

            <br>

            ${
                questionnaire[key]
                instanceof FileList

                ?

                questionnaire[key]
                .length +
                " File(s)"

                :

                questionnaire[key]
            }

        </div>

        `;
    });

    html += `

    <button
    class="btn btn-success mt-4"
    onclick="submitPortal()">

    Submit Registration

    </button>

    </div>`;

    document.getElementById(
        "questionContainer"
    ).innerHTML =
    html;
}

async function submitPortal(){

    try{

        showLoading();

        const payload = {

            ...questionnaire,

            attachments:[]
        };

        if(
    questionnaire.supportingDocs &&
    questionnaire.supportingDocs.length > 0
)
{

            for(
    let i=0;
    i<questionnaire.supportingDocs.length;
    i++
){

                const file =
                    questionnaire.supportingDocs[i];

                const base64Content =
                    await convertFileToBase64(
                        file
                    );

                payload.attachments.push({

                    name:file.name,

                    type:file.type,

                    size:file.size,

                    content:
                        base64Content

                });

            }

        }

        console.log(
            "Payload to Flow:",
            payload
        );

        const response =
        await fetch(

        "https://default6c4b33465ad44991b51ebb35a33065.b0.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/24/workflows/1668323414524895ab891b56851a2dba/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=zhogXnjJJ8sUnEzWbgrp_JCJ40yQ_hF2brMoYPDSvug",

        {
            method:"POST",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:
            JSON.stringify(payload)
        });

        const responseText =
            await response.text();

        console.log(
            responseText
        );

        hideLoading();

        if(response.ok){

            document.body.innerHTML = `

            <div style="
            display:flex;
            justify-content:center;
            align-items:center;
            height:100vh;
            background:#f5f9fc;">

                <div style="
                background:white;
                padding:50px;
                border-radius:20px;
                max-width:700px;
                text-align:center;
                box-shadow:
                0 20px 50px
                rgba(0,0,0,.1);">

                    <h1
                    style="
                    color:#107c41;">

                    ✓ Registration Submitted

                    </h1>

                    <p>

                    Thank you for submitting
                    your registration.

                    Our team will review
                    the information provided
                    and contact you should any
                    additional information
                    be required.

                    </p>

                </div>

            </div>

            `;
        }
        else{

            alert(
                "Submission Failed"
            );
        }

    }
    catch(error){

        hideLoading();

        console.error(error);

        alert(
            error.message
        );
    }

}

function convertFileToBase64(file){

    return new Promise((resolve,reject)=>{

        const reader =
            new FileReader();

        reader.readAsDataURL(file);

        reader.onload = function(){

            const base64String =
                reader.result
                .split(",")[1];

            resolve(base64String);
        };

        reader.onerror = function(error){

            reject(error);
        };

    });

}