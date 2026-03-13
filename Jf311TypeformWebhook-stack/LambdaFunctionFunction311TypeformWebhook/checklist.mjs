import { PutObjectCommand } from "@aws-sdk/client-s3";

export const getIssuesNotes = (answers) => {
  return answers
    .filter((answer) => answer.field.ref.match("-(?:issues)|(?:notes)"))
    .map((answer) => {
      const section = answer.field.ref.slice(0, -3);
      if (section.match(/-issues/)) {
        return {
          section,
          type: "issues",
          value: answer?.choices?.labels,
        };
      } else {
        return {
          section,
          type: "notes",
          value: answer?.text,
        };
      }
    });
};
const makeChecklistHtml = (issuesNotes, title, subtitle) => {
  const checklistSections = issuesNotes
    .map((answer) => {
      if (answer.type === "issues") {
        const listItems = answer.value
          .map((issue) => {
            return `<li>
            <label>
                <input type="checkbox">
                ${issue}
            </label>
          </li>`;
          })
          .join("");
        return `<h2>${answer.section}</h2><ul>${listItems}</ul>`;
      } else {
        return `<h3>${answer.section}</h3><p>${answer.value}</p>`;
      }
    })
    .join("");

  const htmlText = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <link rel="stylesheet" href="https://justfix-311-checklists.s3.us-east-1.amazonaws.com/checklist-styles-upt.css">
    </head>
    <body>
        <h1>${title}</h1>
        <h2>${subtitle}</h2>
        ${checklistSections}
    </body>
    </html>`;

  return htmlText;
};

export const uploadChecklist = async (issuesNotes, s3Client, title, subtitle, subdir, hash) => {
  const checklistHtml = makeChecklistHtml(issuesNotes, title, subtitle);
  const bucket = process.env.CHECKLIST_BUCKET;
  const key = `${subdir}/${hash}/checklist.html`;
  const params = {
    Bucket: bucket,
    Key: key,
    Body: checklistHtml,
    ContentType: "text/html",
    ContentDisposition: "inline",
  };
  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  return `https://${bucket}.s3.us-east-1.amazonaws.com/${key}`;
};
