const conf = require('./config.js');

async function assignOrgLabel(context, conf) {
  const G = context.github;
  const username = context.payload.issue.user.login;
  const orgs = await G.orgs.listForUser({ username });
  const orgNames = orgs.data.map(v => v.login);
  const issueCtx = context.issue();
  orgNames.filter(org => conf.ORG_WHITELIST.includes(org)).forEach(org => {
    return G.issues.addLabels(
      context.issue({ issue_number: issueCtx.number, labels: [org] }));
  });
}
async function emojiLabel(context) {
  const issueCtx = context.issue();
  const issue = await context.github.issues.get(
    context.issue({ issue_number: context.payload.issue.number }));
  const comment = context.payload.comment.body.toLowerCase();
  if (context.payload.comment.user.type != "Bot") {
    const match = comment.match(/🏷(.*)(\n|$)/);
    if (match) {
      const label = match[1].trim();
      const isValidTag = label.match(/^[a-z0-9-\.]+$/i);
      if (isValidTag) {
        if (comment.includes('🗑 🏷 ')) {
          return context.github.issues.removeLabel(
            context.issue({ issue_number: issueCtx.number, name: label }));
        }
        else {
          return context.github.issues.addLabels(
            context.issue({ issue_number: issueCtx.number, labels: [label] }));
        }
      }
    }
  }
}

async function createIssueComment(context, msg) {
  const newComment = context.issue({ body: msg });
  return context.github.issues.createComment(newComment);
}

module.exports = app => {

  app.on('issues.opened', async context => {
    assignOrgLabel(context, conf);
  })

  app.on('pull_request.opened', async context => {
    assignOrgLabel(context, conf);
  })

  app.on('issue_comment.created', async context => {
    emojiLabel(context);
  });

  app.on('pull_request_review_comment.created', async context => {
  });

}