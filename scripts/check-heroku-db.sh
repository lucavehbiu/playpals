#!/bin/bash

echo "Checking Heroku database tables..."
heroku pg:psql --app playpals-web --command "\dt"

echo ""
echo "Checking table counts..."
heroku pg:psql --app playpals-web --command "
SELECT
  schemaname,
  tablename,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT
    table_name as tablename,
    table_schema as schemaname,
    query_to_xml(format('select count(*) as cnt from %I.%I', table_schema, table_name), false, true, '') as xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
) t
ORDER BY row_count DESC;
"
