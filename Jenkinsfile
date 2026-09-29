pipeline {
    agent any


     environment {
        ECR_REGISTRY = '155409187448.dkr.ecr.ap-south-1.amazonaws.com'
        ECR_REPOSITORY = 'jenkins/demo1'
        IMAGE_TAG = "${params.DEPLOY_VERSION ?: BUILD_NUMBER}"
    }

    tools {
        nodejs 'node22'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm install'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Use Secret') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'my-secret',
                        variable: 'MY_SECRET'
                    )
                ]) {
                    sh 'echo "Secret is available: $MY_SECRET"'
                }
            }
        }

       stage('Docker Build') {
    when {
        expression {
            !params.DEPLOY_VERSION?.trim()
        }
    }
    steps {
        sh 'docker build -t jenkins-demo:${IMAGE_TAG} .'
        echo "Docker build completed with tag: ${IMAGE_TAG}"
    }
}


        stage('ECR Login') {
    steps {
        withCredentials([
            [$class: 'AmazonWebServicesCredentialsBinding',
             credentialsId: 'aws-ecr']
        ]) {
            sh '''
                aws ecr get-login-password --region ap-south-1 |
                docker login --username AWS --password-stdin \
                155409187448.dkr.ecr.ap-south-1.amazonaws.com
            '''
        }
    }
}
stage('Push to ECR') {
    when {
        expression {
            !params.DEPLOY_VERSION?.trim()
        }
    }
    steps {
        sh '''
            docker tag jenkins-demo:${IMAGE_TAG} \
            ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

            docker push \
            ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
        '''
    }
}

stage('Approval') {
    steps {
        input message: 'Deploy to EC2?', ok: 'Deploy'
    }
}

stage('Check jq') {
    steps {
        sh 'jq --version'
    }
}



stage('Check ECS') {
    steps {
        withCredentials([
            [$class: 'AmazonWebServicesCredentialsBinding',
             credentialsId: 'aws-ecr']
        ]) {
            sh '''
                aws ecs describe-services \
                --cluster jenkins-demo-cluster \
                --services jenkins-demo-service \
                --region ap-south-1
            '''
        }
    }
}

stage('Prepare ECS Task Definition') {
    steps {
        withCredentials([
            [$class: 'AmazonWebServicesCredentialsBinding',
             credentialsId: 'aws-ecr']
        ]) {
            sh '''
                aws ecs describe-task-definition \
                --task-definition jenkins-demo \
                --region ap-south-1 \
                --query taskDefinition > taskdef.json

                jq --arg IMAGE "${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}" \
                '.containerDefinitions[0].image = $IMAGE |
                 del(
                    .taskDefinitionArn,
                    .revision,
                    .status,
                    .requiresAttributes,
                    .compatibilities,
                    .registeredAt,
                    .registeredBy
                 )' \
                taskdef.json > new-taskdef.json
            '''
        }
    }
}

stage('Register ECS Task Definition') {
    steps {
        withCredentials([
            [$class: 'AmazonWebServicesCredentialsBinding',
             credentialsId: 'aws-ecr']
        ]) {
            sh '''
                aws ecs register-task-definition \
                --cli-input-json file://new-taskdef.json \
                --region ap-south-1 \
                --query 'taskDefinition.taskDefinitionArn' \
                --output text > taskdef-arn.txt

                echo "Registered Task Definition:"
                cat taskdef-arn.txt
            '''
        }
    }
}

stage('Update ECS Service') {
    steps {
        withCredentials([
            [$class: 'AmazonWebServicesCredentialsBinding',
             credentialsId: 'aws-ecr']
        ]) {
            sh '''
                TASK_DEF_ARN=$(cat taskdef-arn.txt)

                echo "Updating ECS service with:"
                echo "$TASK_DEF_ARN"

                aws ecs update-service \
                    --cluster jenkins-demo-cluster \
                    --service jenkins-demo-service \
                    --task-definition "$TASK_DEF_ARN" \
                    --region ap-south-1
            '''
        }
    }
}
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed!'
        }
    }
}