-- Drag-to-reorder the systems catalog. The display order is stored per system in
-- system_settings. `enabled` becomes nullable so a row can carry an order without
-- forcing an on/off override: a null `enabled` means "inherit the code default".

alter table onesky.system_settings alter column enabled drop not null;
alter table onesky.system_settings add column if not exists sort_order integer;
