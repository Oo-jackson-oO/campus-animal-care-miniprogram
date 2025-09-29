-- 测试多次执行数据库脚本的安全性
-- 这个脚本用于验证init.sql可以安全地多次执行

USE campus_animal_care;

-- 显示当前数据库中的所有表
SELECT 'Current tables in database:' as message;
SHOW TABLES;

-- 显示当前数据库中的所有视图
SELECT 'Current views in database:' as message;
SELECT TABLE_NAME as view_name 
FROM information_schema.VIEWS 
WHERE TABLE_SCHEMA = 'campus_animal_care';

-- 显示当前数据库中的所有存储过程
SELECT 'Current procedures in database:' as message;
SELECT ROUTINE_NAME as procedure_name 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'campus_animal_care' 
AND ROUTINE_TYPE = 'PROCEDURE';

-- 显示当前数据库中的所有触发器
SELECT 'Current triggers in database:' as message;
SELECT TRIGGER_NAME as trigger_name 
FROM information_schema.TRIGGERS 
WHERE TRIGGER_SCHEMA = 'campus_animal_care';

-- 显示用户表中的数据
SELECT 'Users in database:' as message;
SELECT id, openid, nickname, created_at FROM users;

-- 显示数据库版本信息
SELECT 'Database version and charset:' as message;
SELECT VERSION() as mysql_version, 
       @@character_set_database as database_charset,
       @@collation_database as database_collation;



