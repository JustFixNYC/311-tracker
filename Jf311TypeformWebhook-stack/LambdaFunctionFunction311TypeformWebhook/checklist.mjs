import { PutObjectCommand } from "@aws-sdk/client-s3";

const makeChecklistHtml = (answers, title) => {
  const answersBySection = answers
    .filter((answer) => answer.field.ref.match("-(?:issues)|(?:notes)$"))
    .map((answer) => {
      const section = answer.field.ref;
      if (section.match(/-issues$/)) {
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

  const checklistSections = answersBySection
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
        <style>
            ul {
                list-style-type: none;
            }
            ul, p {
                padding-left: 1rem;
            }
            li {
                margin-bottom: 1rem;
            }
        </style>
    </head>
    <body>
        <h1>${title}</h1>
        ${checklistSections}
    </body>
    </html>`;

  return htmlText;
};

export const uploadChecklist = async (answers, s3Client, title, subdir) => {
  const checklistHtml = makeChecklistHtml(answers, title);
  const randomId = crypto.randomUUID();
  const bucket = process.env.CHECKLIST_BUCKET;
  const key = `${subdir}/${randomId}/checklist.html`;
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
