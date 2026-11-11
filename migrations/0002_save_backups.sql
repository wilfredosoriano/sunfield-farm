CREATE TABLE IF NOT EXISTS save_backups (user_id TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id,revision));
CREATE TRIGGER IF NOT EXISTS backup_farm_before_update BEFORE UPDATE ON farm_saves BEGIN
 INSERT OR IGNORE INTO save_backups VALUES (OLD.user_id,OLD.revision,OLD.data,OLD.updated_at);
 DELETE FROM save_backups WHERE user_id=OLD.user_id AND revision<OLD.revision-4;
END;
