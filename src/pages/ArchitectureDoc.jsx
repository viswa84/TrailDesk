import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shield } from 'lucide-react';

export default function ArchitectureDoc() {
  const [content, setContent] = useState('');

  useEffect(() => {
    // In a real app we would load this from an API endpoint,
    // but for now since we built it as a markdown file, we can just hardcode the text
    // we want the admin to see so they have full reference.
    const markdown = `# TrailDesk SaaS — Architecture & Admin Guide

## 1. Authentication System
TrailDesk uses a custom JSON Web Token (JWT) based authentication system designed for a multi-tenant environment.

### 1.1 Auth Flow
1. **Login Trigger**: User submits phone + password.
2. **Backend Verification**: \`login\` mutation verifies bcrypt password and checks if the user's \`Tenant\` is suspended.
3. **Token Generation**: Backend generates a JWT containing: \`{ userId, tenantId, role }\`
4. **Token Storage**: Frontend stores the JWT in \`localStorage\` under \`traildesk_token\`.
5. **Request Auth**: Apollo Client attaches \`Authorization: Bearer <token>\` to every GraphQL request.

## 2. Multi-Tenancy (Data Isolation)
TrailDesk uses a **Shared Database / Shared Schema** approach.

### 2.1 The Rules of Isolation
1. Every standard document (Trek, Booking, Customer, Invoice, etc.) MUST have a \`tenantId\` field referencing the \`Tenant\` collection.
2. **Write Rule**: Every creation mutation MUST insert the \`tenantId\` of the current logged-in user.
3. **Read Rule**: Every query resolver MUST automatically append \`{ tenantId: user.tenantId }\` to the MongoDB filter object.

### 2.2 Roles & Access
* **Super Admin**: \`tenantId\` is null. Has global access to create/suspend tenants.
* **Admin**: \`tenantId\` is assigned. Has full read/write access to all data bearing their \`tenantId\`.
* **Staff**: Same \`tenantId\` access as Admin, but restricted on certain mutations.

## 3. Super Admin & Licensing
1. **Trial**: Upon registration, an organization gets \`status: "trial"\` and \`licenseExpiry\` set to 30 days.
2. **Active**: Upon payment, status becomes \`active\` and expiry extends.
3. **Suspended**: If unpaid or manually blocked, status becomes \`suspended\`.
`;
    setContent(markdown);
  }, []);

  return (
    <div className="card mt-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Shield className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-slate-900 text-sm">System Architecture & Documentation</h3>
      </div>
      <div className="p-6 prose prose-slate max-w-none prose-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
