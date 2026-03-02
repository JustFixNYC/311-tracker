import { ContentfulPage } from "../../../contentful/ContentfulPage";
import privacyPolicy from "../../../data/privacy-policy.en.json";

export const PrivacyPolicy: React.FC = () => {
  return (
    <div id="privacy-policy-page">
      <ContentfulPage pageFields={privacyPolicy} />
    </div>
  );
};
