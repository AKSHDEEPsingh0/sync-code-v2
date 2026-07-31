terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS geographic region context
provider "aws" {
  region = "us-east-1"
}

# Create a secure cloud firewall group for our project environment
resource "aws_security_group" "sync_code_sg" {
  name        = "sync-code-production-firewall"
  description = "Allow inbound app traffic from the public web"

  # Expose SSH access rule for server maintenance operations
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Expose Port 3000 for our live React web front-end client interface
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Expose Port 5001 for our distributed TypeScript socket engine container
  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound rules block: Allow instance to communicate freely with public internet namespaces
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Provision a production-grade virtual machine instance running Ubuntu Server
resource "aws_instance" "production_web_host" {
  ami           = "ami-0e86c45e6b8f3b003" # Official Ubuntu 24.04 LTS x86_64 AMI ID (us-east-1)
  instance_type = "t2.micro"             # Free-tier eligible sizing footprint
  
  # Attach our firewall rules dynamically to this server unit context
  vpc_security_group_ids = [aws_security_group.sync_code_sg.id]

  tags = {
    Name        = "SyncCode-Production-ClusterHost"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}
