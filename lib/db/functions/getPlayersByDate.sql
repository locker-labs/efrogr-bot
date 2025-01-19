CREATE OR REPLACE FUNCTION get_user_plays_by_date(input_date DATE)
RETURNS TABLE(
    user_id INT,
    tg_id TEXT,
    address TEXT,
    play_date DATE,
    last_play_date TIMESTAMP,
    tg_username TEXT,
    num_plays INT,
    high_score INT,
    croak_used NUMERIC
) AS
$$
BEGIN
RETURN QUERY
SELECT
    u."id" AS user_id,
    u."tgJson" ->> 'id' AS tg_id,
    u.address,
    DATE_TRUNC('day', p."createdAt" AT TIME ZONE 'UTC') AS play_date,
    MAX(p."createdAt") AS last_play_date,
    u."tgJson" ->> 'username' AS tg_username,
    COUNT(*) AS num_plays,
    MAX(p.score) AS high_score,
    SUM(CAST(p."croakUsed" AS NUMERIC)) / 1e18 AS croak_used
FROM
    efrogr_plays p
    JOIN
    efrogr_users u ON p."efrogrUserId" = u.id
WHERE
    DATE(p."createdAt" AT TIME ZONE 'UTC') = input_date
GROUP BY
    u.id,
    play_date,
    u."tgJson" ->> 'username',
    u."tgJson" ->> 'id',
    u.address
ORDER BY
    play_date DESC,
    high_score DESC;
END;
$$ LANGUAGE plpgsql;
