const DeploymentLink =
  "https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app";

const DocsLink =
  "https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app";

const LearnLink =
  "https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app";

const ExamplesLink =
  "https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app";

const GoToNextJsLink =
  "https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app";

export const demoLinksObject: DemoLinksObjectType = {
  deploymentLink: DeploymentLink,
  docsLink: DocsLink,
  learnLink: LearnLink,
  examplesLink: ExamplesLink,
  goToNextJsLink: GoToNextJsLink,
};

type DemoLinksObjectType = {
  deploymentLink: string;
  docsLink: string;
  learnLink: string;
  examplesLink: string;
  goToNextJsLink: string;
};
