const portalSteps = [

{
    title:"Company Information",

    questions:[

        {
            id:"companyName",
            label:"Legal Company Name",
            type:"text",required:true
            
        },

        {
            id:"businessName",
            label:"Registered Business Name",
            type:"text",required:true
        },

        {
            id:"registrationNumber",
            label:"Company Registration Number",
            type:"text",required:true
        },

        {
            id:"country",
            label:"Country",
            type:"dropdown",
            options:[
                "India",
                "United States",
                "United Kingdom",
                "Germany",
                "Australia"
            ],required:true
        },

        {
            id:"website",
            label:"Company Website",
            type:"text",required:true
        }

    ]
},

{
    title:"Primary Contact",

    questions:[

        {
            id:"contactName",
            label:"Primary Contact Name",
            type:"text",required:true
        },

        {
            id:"jobTitle",
            label:"Job Title",
            type:"text",required:true
        },

        {
            id:"email",
            label:"Email Address",
            type:"text",required:true
        },

        {
            id:"phone",
            label:"Phone Number",
            type:"text",required:true
        }

    ]
},

{
    title:"Compliance & Tax",

    questions:[

        {
            id:"taxNumber",
            label:"Tax Registration Number",
            type:"text",required:true
        },

        {
            id:"gst",
            label:"VAT / GST Number",
            type:"text",required:true
        }

    ]
},

{
    title:"Documents",

    questions:[

        {
            id:"supportingDocs",
            label:"Upload Supporting Documents",
            type:"file",
    required:true
        }

    ]
},

{
    title:"Review & Submit",
    questions:[]
}

];