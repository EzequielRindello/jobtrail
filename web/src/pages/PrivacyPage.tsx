import PageHeader from '../components/PageHeader';

import '../styles/PolicyPage.css';

export default function PrivacyPage() {
  return (
    <div className="policy-page">
      <PageHeader title="Privacy Policy" />

      <p className="policy-updated">Last updated: November 24, 2026</p>

      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy describes how JobTrail collects, uses, and handles personal information
        when users access the platform and its features.
      </p>

      <h2>2. Information We Collect</h2>
      <p>JobTrail may collect the following information:</p>
      <ul>
        <li>Account information, including email addresses.</li>
        <li>Job application details and application history.</li>
        <li>Personal notes and job-related contact information.</li>
        <li>Skills and other career-related information provided by users.</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>Information provided by users is used to:</p>
      <ul>
        <li>Create and manage user accounts.</li>
        <li>Provide job application tracking functionality.</li>
        <li>Organize and display job search information.</li>
        <li>Maintain and improve platform functionality and security.</li>
      </ul>

      <h2>4. Data Storage and Security</h2>
      <p>
        JobTrail uses authentication and access controls to protect user accounts and application
        records. However, no method of electronic storage or transmission is completely secure.
      </p>

      <h2>5. Browser Extension</h2>
      <p>
        The JobTrail browser extension allows users to collect job listing information from external
        websites and save it to their JobTrail accounts.
      </p>

      <h2>6. Local Storage</h2>
      <p>
        JobTrail uses browser local storage to maintain authentication sessions and support
        application functionality.
      </p>

      <h2>7. Third-Party Websites</h2>
      <p>
        JobTrail may contain links to external job listings and recruitment websites. These websites
        have their own privacy policies and data handling practices.
      </p>

      <h2>8. User Data and Control</h2>
      <p>
        Users can manage, update, and delete their job application records through the available
        platform features.
      </p>

      <h2>9. Data Retention</h2>
      <p>
        Data retention practices will be defined as JobTrail develops and its account management
        features are expanded.
      </p>

      <h2>10. Changes to This Privacy Policy</h2>
      <p>
        This Privacy Policy may be updated as JobTrail evolves. The date displayed at the top of
        this page will reflect the latest revision.
      </p>
    </div>
  );
}
