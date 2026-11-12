/* Original vendor registration fields retained. supportingDocs remains the
   canonical file collection so the existing Power Automate payload stays compatible. */
const portalSteps = [
 { id:"company", title:"Company information", description:"Tell us about your organisation and registered business details.", questions:[
  {id:"companyName",label:"Legal Company Name",type:"text",required:true,placeholder:"Enter the legal name of your company",autocomplete:"organization"},
  {id:"businessName",label:"Registered Business Name",type:"text",required:true,placeholder:"Enter your registered business name"},
  {id:"registrationNumber",label:"Company Registration Number",type:"text",required:true,placeholder:"Enter your company registration number"},
  {id:"country",label:"Country",type:"country",required:true,placeholder:"Select your country"},
  {id:"website",label:"Company Website",type:"url",required:true,placeholder:"https://www.example.com"}
 ]},
 {id:"contact",title:"Primary contact",description:"Who should we contact about this vendor registration?",questions:[
  {id:"contactName",label:"Primary Contact Name",type:"text",required:true,placeholder:"Enter full name",autocomplete:"name"},
  {id:"jobTitle",label:"Job Title",type:"text",required:true,placeholder:"e.g. Finance Manager",autocomplete:"organization-title"},
  {id:"email",label:"Email Address",type:"email",required:true,placeholder:"name@company.com",autocomplete:"email"},
  {id:"phone",label:"Phone Number",type:"tel",required:true,placeholder:"Include country code",autocomplete:"tel",hint:"Include your country or area code."}
 ]},
 {id:"compliance",title:"Compliance & tax",description:"Provide the tax registration details for your organisation.",questions:[
  {id:"taxNumber",label:"Tax Registration Number",type:"text",required:true,placeholder:"Enter your tax registration number"},
  {id:"gst",label:"VAT / GST Number",type:"text",required:true,placeholder:"Enter your VAT or GST number",hint:"Enter the tax identifier applicable in your country."}
 ]},
 {id:"documents",title:"Documents",description:"Upload the documents required to support your vendor registration.",questions:[
  {id:"supportingDocs",label:"Upload Supporting Documents",type:"documents",required:true,hint:"PDF, JPG, PNG, DOC or DOCX. Maximum 10 MB per file."}
 ]},
 {id:"review",title:"Review & submit",description:"Check your information before submitting your registration.",questions:[]}
];
