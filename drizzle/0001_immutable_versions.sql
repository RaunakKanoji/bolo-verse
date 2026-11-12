-- Frozen source identity never changes. Review state is stored separately.
CREATE FUNCTION protect_content_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ready' THEN
    RAISE EXCEPTION 'Ready content versions are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  IF ROW(NEW.id, NEW.project_id, NEW.version, NEW.source_snapshot,
         NEW.source_session_id, NEW.source_scene_revision,
         NEW.source_artifact_version_id, NEW.brief_version_id,
         NEW.author_clerk_id, NEW.created_at)
     IS DISTINCT FROM
     ROW(OLD.id, OLD.project_id, OLD.version, OLD.source_snapshot,
         OLD.source_session_id, OLD.source_scene_revision,
         OLD.source_artifact_version_id, OLD.brief_version_id,
         OLD.author_clerk_id, OLD.created_at) THEN
    RAISE EXCEPTION 'Content source snapshots and version identity are immutable';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER content_version_immutable
  BEFORE UPDATE OR DELETE ON content_versions
  FOR EACH ROW EXECUTE FUNCTION protect_content_version();
--> statement-breakpoint
-- A previously issued upload URL must target staging, never this published key.
-- This protects metadata identity; R2 byte-copy/validation is implemented in M3.
CREATE FUNCTION protect_ready_asset() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ready' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'Ready assets are immutable; create a new asset';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER ready_asset_immutable
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION protect_ready_asset();
