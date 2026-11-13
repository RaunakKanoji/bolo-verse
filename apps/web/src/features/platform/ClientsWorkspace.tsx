"use client";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import {
  CreateStudioClientSchema,
  UpdateStudioClientSchema,
  StudioClientListSchema,
  StudioClientSchema,
  type StudioClient,
} from "@/lib/contracts/workspace";
import { useWorkspaceSession } from "./WorkspaceSession";
import { useWorkspaceData } from "./use-workspace-data";
import { DataState, Modal, dateLabel } from "./WorkspaceComponents";
import { PageHeader, EmptyState, ServiceNotice } from "./WorkspaceUI";
import styles from "./platform.module.css";
import own from "./workspace-screens.module.css";
export function ClientDialog({
  client,
  onClose,
  onSaved,
}: {
  client?: StudioClient;
  onClose: () => void;
  onSaved: () => void;
}) {
  const source = useWorkspaceData("clients?limit=100", StudioClientListSchema);
  const [error, setError] = useState("");
  const [key] = useState(() => crypto.randomUUID());
  return (
    <Modal title={client ? "Edit client" : "Add client"} onClose={onClose}>
      <form
        className={own.dialogForm}
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const fields = {
            name: String(form.get("name")),
            organization: String(form.get("organization")),
            email: String(form.get("email")),
            phone: String(form.get("phone")),
            notes: String(form.get("notes")),
          };
          const parsed = client
            ? UpdateStudioClientSchema.safeParse({ ...fields, expectedRevision: client.revision })
            : CreateStudioClientSchema.safeParse({ ...fields, idempotencyKey: key });
          if (!parsed.success) {
            setError(parsed.error.issues.map((i) => i.message).join(" "));
            return;
          }
          const result = await source.mutate(
            client ? `clients/${client.id}` : "clients",
            z.object({ client: StudioClientSchema }),
            parsed.data,
            client ? "PATCH" : "POST",
          );
          if (result) onSaved();
        }}
      >
        <p className={styles.muted}>
          Unsaved draft · adding a contact does not invite them or grant access to a project.
        </p>
        <label className={styles.field}>
          Client name
          <input name="name" defaultValue={client?.name} required maxLength={160} autoFocus />
        </label>
        <label className={styles.field}>
          Organization
          <input name="organization" defaultValue={client?.organization} maxLength={160} />
        </label>
        <div className={own.twoColumns}>
          <label className={styles.field}>
            Email
            <input name="email" type="email" defaultValue={client?.email} maxLength={254} />
          </label>
          <label className={styles.field}>
            Phone
            <input name="phone" type="tel" defaultValue={client?.phone} maxLength={60} />
          </label>
        </div>
        <label className={styles.field}>
          Client notes
          <textarea
            aria-label="Client notes"
            name="notes"
            defaultValue={client?.notes}
            maxLength={5000}
            rows={4}
          />
        </label>
        {(error || source.error) && (
          <p role="alert" className={styles.error}>
            {error || source.error}
          </p>
        )}
        {!source.configured && (
          <ServiceNotice message="Draft contact details here. Connect and sign in to save them privately." />
        )}
        <button className={styles.button} disabled={source.busy}>
          {source.busy ? "Saving…" : client ? "Save client" : "Add client"}
        </button>
      </form>
    </Modal>
  );
}
export default function ClientsWorkspace() {
  const { sessionKey } = useWorkspaceSession();
  return <ClientsSession key={sessionKey} />;
}
function ClientsSession() {
  const [search, setSearch] = useState("");
  const [create, setCreate] = useState(false);
  const source = useWorkspaceData(
    `clients?limit=100${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    StudioClientListSchema,
  );
  return (
    <div className={styles.page}>
      <PageHeader
        title="Your Clients"
        description="Keep client relationships and creative work connected."
      >
        <button className={styles.button} onClick={() => setCreate(true)}>
          Add client
        </button>
      </PageHeader>
      <DataState {...source} />
      <div className={styles.toolbar}>
        <label className={styles.field}>
          Search clients
          <input
            type="search"
            value={search}
            maxLength={160}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, organization or email"
          />
        </label>
      </div>
      {source.data?.clients.length ? (
        <>
          <p className={styles.muted}>
            {source.data.clients.length} of {source.data.total} clients
            {source.data.total > 100 ? " · Refine your search to find more." : ""}
          </p>
          <div className={own.projectGrid}>
            {source.data.clients.map((client) => (
              <article className={styles.card} key={client.id}>
                <div className={own.cardBody}>
                  <div className={own.clientMark} aria-hidden="true">
                    {client.name.slice(0, 2)}
                  </div>
                  <h2>
                    <Link href={`/clients/${client.id}`}>{client.name}</Link>
                  </h2>
                  <p>{client.organization || "Independent client"}</p>
                  <div className={own.meta}>
                    {client.email && <span>{client.email}</span>}
                    {client.phone && <span>{client.phone}</span>}
                  </div>
                  <div className={own.meta}>
                    <span>{client.activeProjects} active projects</span>
                    <span>{client.pendingReviews} pending reviews</span>
                  </div>
                  <p className={styles.muted}>
                    Last activity:{" "}
                    {client.lastActivityAt
                      ? dateLabel(client.lastActivityAt)
                      : "No project activity yet"}
                  </p>
                  <Link className={styles.secondary} href={`/clients/${client.id}`}>
                    Open client
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title={search ? "No matching clients" : "Build your client directory"}
          description={
            search
              ? "Try a different name, organization or email."
              : "Save contact details, link projects and keep a clear view of each client relationship."
          }
        >
          <button className={styles.button} onClick={() => setCreate(true)}>
            Add your first client
          </button>
        </EmptyState>
      )}
      {create && (
        <ClientDialog
          onClose={() => setCreate(false)}
          onSaved={() => {
            setCreate(false);
            source.refresh();
          }}
        />
      )}
    </div>
  );
}
