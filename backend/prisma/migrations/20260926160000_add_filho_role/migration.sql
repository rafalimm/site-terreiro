-- Adiciona o cargo Filho ao enum de usuários.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'filho';
