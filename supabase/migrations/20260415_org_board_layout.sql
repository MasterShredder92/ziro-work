-- Organization board: persist Zirorb positions (percent of board 0–100) and agent order within a Zirorb.

alter table zirorbs add column if not exists board_x double precision;
alter table zirorbs add column if not exists board_y double precision;

comment on column zirorbs.board_x is 'Horizontal position on org board (0–100), null = auto layout.';
comment on column zirorbs.board_y is 'Vertical position on org board (0–100), null = auto layout.';

alter table agents add column if not exists zirorb_sort integer not null default 0;

create index if not exists idx_agents_zirorb_sort on agents (zirorb_id, zirorb_sort);

comment on column agents.zirorb_sort is 'Display order within a Zirorb; lower first.';

-- Reasonable defaults for seeded Zirorbs (semi-orbit under Star)
update zirorbs set board_x = 28, board_y = 52, updated_at = now() where slug = 'core' and board_x is null;
update zirorbs set board_x = 50, board_y = 58, updated_at = now() where slug = 'music-school' and board_x is null;
update zirorbs set board_x = 72, board_y = 52, updated_at = now() where slug = 'sales' and board_x is null;
update zirorbs set board_x = 50, board_y = 72, updated_at = now() where slug = 'content' and board_x is null;
