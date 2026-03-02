import { ContentfulPage } from "../../../contentful/ContentfulPage";
import termsOfUse from "../../../data/terms-of-use.en.json";

export const TermsOfUse: React.FC = () => {
  return (
    <div id="terms-of-use-page">
      <ContentfulPage pageFields={termsOfUse} />
    </div>
  );
};
