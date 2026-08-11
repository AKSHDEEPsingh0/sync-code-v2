terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# 1. Configure the AWS Security Group (Firewall)
resource "aws_security_group" "sync_code_sg" {
  name        = "sync-code-production-firewall"
  description = "Allow HTTP traffic to Nginx and SSH for GitHub Actions"

  # Expose SSH (22) for GitHub Actions CI/CD Deployment
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Expose HTTP (80) for the Nginx Load Balancer
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound internet access
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 2. Provision the EC2 Linux Host
resource "aws_instance" "production_web_host" {
  ami           = "ami-0e86c45e6b8f3b003" # Ubuntu 24.04 LTS
  instance_type = "t2.micro"             
  
  # CRITICAL: Attach your AWS SSH key pair so GitHub Actions can log in
  key_name      = "sync-code-deploy-key" 
  
  vpc_security_group_ids = [aws_security_group.sync_code_sg.id]

  # Bootstraps Docker automatically on EC2 startup
  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io docker-compose
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ubuntu
  EOF

  tags = {
    Name        = "SyncCode-Production-ClusterHost"
    Environment = "Production"
  }
}