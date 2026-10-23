/**
 * Skills taxonomy for resume intelligence. Families match the ones already in
 * the talent pool so new profiles group with existing data. Each skill lists
 * the aliases a resume might use. Pure and client-safe.
 */

export type SkillDef = {
  name: string;
  aliases?: string[];
  /** Match only the aliases — the name alone is too ambiguous (e.g. "Go", "Epic"). */
  aliasOnly?: boolean;
};

export const SKILL_FAMILIES: Record<string, SkillDef[]> = {
  "Software Engineering": [
    { name: "Java" }, { name: "Python" }, { name: "C#", aliases: ["c sharp"] }, { name: ".NET", aliases: ["dotnet", "asp.net"] },
    { name: "JavaScript", aliases: ["ecmascript"] }, { name: "TypeScript" }, { name: "React", aliases: ["react.js", "reactjs"] },
    { name: "Angular" }, { name: "Vue.js", aliases: ["vue", "vuejs"] }, { name: "Node.js", aliases: ["nodejs", "node js"] },
    { name: "Spring Boot", aliases: ["spring framework", "spring mvc"] }, { name: "Go", aliases: ["golang"], aliasOnly: true }, { name: "Ruby on Rails", aliases: ["rails"] },
    { name: "PHP" }, { name: "Kotlin" }, { name: "Swift" }, { name: "Scala" }, { name: "Rust" }, { name: "C++", aliases: ["cpp"] },
    { name: "Microservices" }, { name: "REST APIs", aliases: ["restful", "rest api"] }, { name: "GraphQL" }, { name: "Git" },
  ],
  "Embedded Systems": [
    { name: "Embedded C", aliases: ["embedded c/c++"] }, { name: "RTOS", aliases: ["freertos", "vxworks"] }, { name: "Firmware" },
    { name: "Microcontrollers", aliases: ["mcu", "arm cortex", "stm32"] }, { name: "Embedded Linux", aliases: ["yocto"] },
    { name: "Device Drivers" }, { name: "AUTOSAR" }, { name: "CAN Bus", aliases: ["can protocol"] }, { name: "FPGA", aliases: ["verilog", "vhdl"] },
  ],
  "Cloud & DevOps": [
    { name: "AWS", aliases: ["amazon web services", "ec2", "s3", "lambda"] }, { name: "Azure", aliases: ["microsoft azure"] },
    { name: "GCP", aliases: ["google cloud"] }, { name: "Kubernetes", aliases: ["k8s", "eks", "aks", "gke"] }, { name: "Docker" },
    { name: "Terraform" }, { name: "Ansible" }, { name: "Jenkins" }, { name: "CI/CD", aliases: ["github actions", "gitlab ci"] },
    { name: "Linux" }, { name: "Helm" }, { name: "Prometheus", aliases: ["grafana"] },
  ],
  "Data & Analytics": [
    { name: "SQL", aliases: ["t-sql", "pl/sql", "postgresql", "mysql"] }, { name: "Tableau" }, { name: "Power BI", aliases: ["powerbi"] },
    { name: "Snowflake" }, { name: "Databricks" }, { name: "Spark", aliases: ["pyspark", "apache spark"] }, { name: "Hadoop" },
    { name: "ETL", aliases: ["informatica", "ssis", "talend"] }, { name: "Machine Learning", aliases: ["ml", "scikit-learn"] },
    { name: "Data Engineering" }, { name: "Pandas" }, { name: "Excel", aliases: ["advanced excel", "vba"] },
    { name: "Airflow" }, { name: "dbt" },
  ],
  Cybersecurity: [
    { name: "SIEM", aliases: ["splunk", "qradar"] }, { name: "Penetration Testing", aliases: ["pen testing", "ethical hacking"] },
    { name: "IAM", aliases: ["identity and access management", "okta", "sailpoint"] }, { name: "SOC" }, { name: "Vulnerability Management", aliases: ["nessus", "qualys"] },
    { name: "Incident Response" }, { name: "NIST" }, { name: "Firewalls", aliases: ["palo alto", "fortinet"] }, { name: "Zero Trust" },
  ],
  "Project Management": [
    { name: "Agile" }, { name: "Scrum" }, { name: "Jira" }, { name: "Waterfall" }, { name: "Stakeholder Management" },
    { name: "Program Management" }, { name: "Risk Management" }, { name: "MS Project", aliases: ["microsoft project"] }, { name: "Budgeting" },
  ],
  "Business Analysis": [
    { name: "Requirements Gathering", aliases: ["business requirements", "brd", "frd"] }, { name: "User Stories" },
    { name: "Process Mapping", aliases: ["bpmn", "visio"] }, { name: "UAT", aliases: ["user acceptance testing"] }, { name: "Gap Analysis" },
  ],
  "QA & Testing": [
    { name: "Selenium" }, { name: "Test Automation" }, { name: "Cypress" }, { name: "Playwright" }, { name: "JUnit", aliases: ["testng"] },
    { name: "Manual Testing" }, { name: "Performance Testing", aliases: ["jmeter", "loadrunner"] }, { name: "API Testing", aliases: ["postman"] },
  ],
  "ERP & CRM": [
    { name: "SAP", aliases: ["sap s/4hana", "sap fico", "sap mm", "abap"] }, { name: "Salesforce", aliases: ["apex", "sfdc"] },
    { name: "Oracle EBS", aliases: ["oracle e-business"] }, { name: "Workday" }, { name: "ServiceNow" }, { name: "Dynamics 365", aliases: ["dynamics crm"] }, { name: "NetSuite" },
  ],
  "Health IT": [
    { name: "Epic", aliases: ["epic ehr", "epic systems", "epic certified", "epic clarity", "epic hyperspace"], aliasOnly: true }, { name: "Cerner" }, { name: "HL7", aliases: ["fhir"] }, { name: "HIPAA" },
    { name: "EHR", aliases: ["electronic health records", "emr"] }, { name: "Meditech" },
  ],
  "Nursing & Clinical": [
    { name: "Registered Nurse", aliases: ["rn"] }, { name: "BLS" }, { name: "ACLS" }, { name: "ICU", aliases: ["critical care"] },
    { name: "Med-Surg", aliases: ["medical-surgical"] }, { name: "Patient Care" }, { name: "Telemetry" },
  ],
  "Finance & Accounting": [
    { name: "GAAP" }, { name: "Financial Reporting" }, { name: "Accounts Payable" }, { name: "Accounts Receivable" },
    { name: "Reconciliation" }, { name: "SOX", aliases: ["sarbanes-oxley"] }, { name: "QuickBooks" }, { name: "FP&A", aliases: ["financial planning"] }, { name: "Audit", aliases: ["internal audit", "external audit", "audit and assurance"], aliasOnly: true },
  ],
  "Networking & Infrastructure": [
    { name: "Cisco", aliases: ["ccna", "ccnp"] }, { name: "TCP/IP" }, { name: "Routing & Switching", aliases: ["bgp", "ospf"] },
    { name: "VMware", aliases: ["vsphere"] }, { name: "Windows Server", aliases: ["active directory"] }, { name: "SD-WAN" },
  ],
  "Supply Chain & Logistics": [
    { name: "Inventory Management" }, { name: "Procurement" }, { name: "WMS", aliases: ["warehouse management"] }, { name: "Logistics" },
    { name: "Demand Planning" }, { name: "Six Sigma", aliases: ["lean six sigma"] },
  ],
};

/** Well-known certifications to look for (case-insensitive). */
export const CERTIFICATIONS = [
  "PMP", "CAPM", "PgMP", "CSM", "Certified ScrumMaster", "SAFe", "PMI-ACP", "CISSP", "CISM", "CISA", "CEH", "Security+", "CompTIA A+", "Network+",
  "CCNA", "CCNP", "CCIE", "AWS Certified", "Azure Administrator", "Azure Solutions Architect", "Google Cloud Professional", "CKA", "CKAD",
  "ITIL", "Six Sigma Green Belt", "Six Sigma Black Belt", "CPA", "CMA", "CFA", "SHRM-CP", "PHR", "BLS", "ACLS", "PALS", "RN",
  "Salesforce Certified", "Oracle Certified", "Microsoft Certified", "ISTQB", "TOGAF", "Epic Certified",
];

export const DEGREES: [RegExp, string][] = [
  [/\b(ph\.?\s?d|doctorate)\b/i, "Doctorate"],
  [/\b(m\.?\s?b\.?\s?a)\b/i, "MBA"],
  [/\b(master'?s|master\s+(?:of|degree)|m\.?\s?s\.?|m\.?\s?sc|m\.?\s?tech|m\.?\s?e\.?|m\.?\s?c\.?\s?a)\b/i, "Master's"],
  [/\b(bachelor'?s|bachelor\s+(?:of|degree)|b\.?\s?s\.?|b\.?\s?sc|b\.?\s?tech|b\.?\s?e\.?|b\.?\s?a\.?|b\.?\s?com)\b/i, "Bachelor's"],
  [/\b(associate'?s? degree|a\.?\s?a\.?s)\b/i, "Associate"],
];
