let questionnaire = {};

function nextStep(current, next) {

    document.getElementById(
        "step" + current
    ).style.display = "none";

    document.getElementById(
        "step" + next
    ).style.display = "block";
}

function prevStep(current, previous) {

    document.getElementById(
        "step" + current
    ).style.display = "none";

    document.getElementById(
        "step" + previous
    ).style.display = "block";
}

async function submitForm() {

    try {

        questionnaire = {};

        questionnaire.vendorName =
            document.getElementById("vendorName").value;

        questionnaire.country =
            document.getElementById("country").value;

        questionnaire.contact =
            document.getElementById("contact").value;

        questionnaire.taxid =
            document.getElementById("taxid").value;

        questionnaire.businessType =
            document.getElementById("businessType").value;

        const files =
            document.getElementById("files").files;

        questionnaire.attachments = [];

        for (let i = 0; i < files.length; i++) {

            const file = files[i];

            console.log(
                "Processing file:",
                file.name
            );

            const base64Content =
                await convertFileToBase64(file);

            questionnaire.attachments.push({

                name: file.name,

                type: file.type,

                size: file.size,

                content: base64Content

            });
        }

        console.log(
            "Payload being sent:",
            questionnaire
        );

        const response = await fetch(

            "https://default6c4b33465ad44991b51ebb35a33065.b0.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/24/workflows/1668323414524895ab891b56851a2dba/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=zhogXnjJJ8sUnEzWbgrp_JCJ40yQ_hF2brMoYPDSvug",

            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(questionnaire)
            }
        );

        console.log(
            "Status:",
            response.status
        );

        const responseText =
            await response.text();

        console.log(
            "Response Body:",
            responseText
        );

        if (response.ok) {

            alert(
                "Vendor submission successful!"
            );

        }
        else {

            alert(
                "Submission failed. Status: " +
                response.status
            );

        }

    }
    catch (error) {

        console.error(
            "Error:",
            error
        );

        alert(
            "Error: " +
            error.message
        );

    }
}

function convertFileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();

        reader.readAsDataURL(file);

        reader.onload = function () {

            const base64String =
                reader.result.split(",")[1];

            resolve(base64String);
        };

        reader.onerror = function (error) {

            reject(error);
        };

    });
}