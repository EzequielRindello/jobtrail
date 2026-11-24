import PageHeader from '../components/PageHeader';
import '../styles/PolicyPage.css';

export default function PolicyPage() {
  return (
    <div className="policy-page">
      <PageHeader title="Terms and Conditions" />

      <p className="policy-updated">Last updated: November 24, 2026</p>

      <h2>1. Introduction and Acceptance</h2>
      <p>
        JobTrail is a job application management platform designed to help users organize, track,
        and manage their job search. These terms describe the conditions for using JobTrail and its
        features.
      </p>

      <h2>2. User Accounts</h2>
      <p>
        Users are responsible for providing accurate account information, protecting their login
        credentials, and ensuring that their accounts are used responsibly.
      </p>

      <h2>3. Acceptable Use</h2>
      <p>When using JobTrail, users must not:</p>
      <ul>
        <li>Use the platform for illegal or fraudulent activities.</li>
        <li>Attempt to access another user's account without permission.</li>
        <li>Submit malicious or harmful content.</li>
        <li>Disrupt the operation or security of the platform.</li>
      </ul>

      <h2>4. Intellectual Property</h2>
      <p>
        The JobTrail name, design, software, and original materials are subject to their applicable
        ownership and licensing rights.
      </p>

      <h2>5. User Content</h2>
      <p>
        Users retain their rights to the information they add to JobTrail, including application
        details, personal notes, and job-related records. Users are responsible for the content they
        provide.
      </p>

      <h2>6. Third-Party Links</h2>
      <p>
        JobTrail may contain links to external job listings and recruitment websites. Users should
        review the terms and privacy practices of those websites independently.
      </p>

      <h2>7. Service Availability</h2>
      <p>
        JobTrail is under active development. Features may change or become temporarily unavailable
        during maintenance, updates, or technical issues.
      </p>

      <h2>8. Account Suspension and Termination</h2>
      <p>
        Access to JobTrail may be restricted if an account is used in violation of these terms or
        threatens platform security.
      </p>

      <h2>9. Disclaimer and Limitation of Liability</h2>
      <p>
        JobTrail is an organizational tool and does not guarantee employment, interviews, successful
        applications, or the accuracy of external job listings.
      </p>

      <h2>10. Changes to These Terms</h2>
      <p>
        These terms may be revised as JobTrail develops. The date displayed at the top of this page
        will reflect the latest revision.
      </p>
    </div>
  );
}
