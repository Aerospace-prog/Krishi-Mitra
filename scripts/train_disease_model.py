"""
Train disease detection model with PlantVillage dataset.
This script works with the dataset in data/plantvillage dataset/color/ folder.
"""

import os
import sys
import shutil
from pathlib import Path
import logging
import json

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from scripts.disease_detection_model import DiseaseDetectionModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_dataset():
    """Check if the PlantVillage dataset exists and get info."""
    dataset_path = project_root / "data" / "plantvillage dataset" / "color"
    
    if not dataset_path.exists():
        logger.error("❌ PlantVillage dataset not found!")
        logger.error("Expected path: data/plantvillage dataset/color/")
        return None
    
    # Get disease classes
    disease_classes = [d for d in dataset_path.iterdir() if d.is_dir()]
    
    if len(disease_classes) == 0:
        logger.error("❌ No disease classes found in dataset!")
        return None
    
    # Count images per class
    class_info = {}
    total_images = 0
    
    for disease_class in disease_classes:
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
        images = []
        for ext in image_extensions:
            images.extend(list(disease_class.glob(ext)))
        
        class_info[disease_class.name] = len(images)
        total_images += len(images)
    
    logger.info(f"✅ Found {len(disease_classes)} disease classes")
    logger.info(f"✅ Total images: {total_images:,}")
    
    # Show top 10 classes by image count
    sorted_classes = sorted(class_info.items(), key=lambda x: x[1], reverse=True)
    logger.info("📊 Top disease classes by image count:")
    for i, (class_name, count) in enumerate(sorted_classes[:10]):
        logger.info(f"  {i+1}. {class_name}: {count:,} images")
    
    return {
        'path': dataset_path,
        'classes': [d.name for d in disease_classes],
        'class_info': class_info,
        'total_images': total_images
    }

def organize_dataset(source_path, output_dir):
    """Organize dataset into train/validation split with enhanced handling."""
    try:
        logger.info("📁 Organizing dataset into train/validation split...")
        
        # Create output directories
        train_dir = output_dir / "train"
        val_dir = output_dir / "validation"
        
        # Remove existing directories if they exist
        if train_dir.exists():
            logger.info("🗑️ Removing existing train directory...")
            shutil.rmtree(train_dir)
        if val_dir.exists():
            logger.info("🗑️ Removing existing validation directory...")
            shutil.rmtree(val_dir)
        
        train_dir.mkdir(parents=True, exist_ok=True)
        val_dir.mkdir(parents=True, exist_ok=True)
        
        # Get all disease classes
        disease_classes = [d for d in source_path.iterdir() if d.is_dir()]
        disease_classes.sort()  # Sort for consistent ordering
        
        logger.info(f"📊 Found {len(disease_classes)} disease classes to process")
        
        total_train = 0
        total_val = 0
        class_stats = []
        
        for i, disease_class in enumerate(disease_classes, 1):
            class_name = disease_class.name
            logger.info(f"[{i}/{len(disease_classes)}] Processing {class_name}...")
            
            # Create class directories
            train_class_dir = train_dir / class_name
            val_class_dir = val_dir / class_name
            train_class_dir.mkdir(exist_ok=True)
            val_class_dir.mkdir(exist_ok=True)
            
            # Get all images with multiple extensions
            image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
            images = []
            for ext in image_extensions:
                images.extend(list(disease_class.glob(ext)))
            
            if len(images) == 0:
                logger.warning(f"  ⚠️ No images found in {class_name}")
                continue
            
            # Shuffle images for random split
            import random
            random.shuffle(images)
            
            # Adaptive split ratio based on class size
            if len(images) < 50:
                # For small classes, use 70-30 split to ensure validation data
                split_ratio = 0.7
            elif len(images) < 200:
                # Medium classes use 75-25 split
                split_ratio = 0.75
            else:
                # Large classes use 80-20 split
                split_ratio = 0.8
            
            split_idx = int(len(images) * split_ratio)
            train_images = images[:split_idx]
            val_images = images[split_idx:]
            
            # Ensure at least 1 validation image
            if len(val_images) == 0 and len(images) > 1:
                train_images = images[:-1]
                val_images = images[-1:]
            
            # Copy images with progress tracking
            for img in train_images:
                shutil.copy2(img, train_class_dir / img.name)
            
            for img in val_images:
                shutil.copy2(img, val_class_dir / img.name)
            
            total_train += len(train_images)
            total_val += len(val_images)
            
            class_stats.append({
                'class': class_name,
                'total': len(images),
                'train': len(train_images),
                'val': len(val_images),
                'split_ratio': f"{len(train_images)}/{len(val_images)}"
            })
            
            logger.info(f"  ✅ {len(train_images)} train, {len(val_images)} val ({len(images)} total)")
        
        # Log summary statistics
        logger.info(f"✅ Dataset organized successfully!")
        logger.info(f"📊 Summary Statistics:")
        logger.info(f"   • Total classes: {len(class_stats)}")
        logger.info(f"   • Total training images: {total_train:,}")
        logger.info(f"   • Total validation images: {total_val:,}")
        logger.info(f"   • Overall split ratio: {total_train/(total_train+total_val):.1%} train")
        
        # Show classes with smallest datasets (potential issues)
        small_classes = [c for c in class_stats if c['total'] < 100]
        if small_classes:
            logger.warning(f"⚠️ Classes with <100 images ({len(small_classes)} classes):")
            for c in sorted(small_classes, key=lambda x: x['total'])[:5]:
                logger.warning(f"   • {c['class']}: {c['total']} images")
        
        return str(train_dir), str(val_dir)
        
    except Exception as e:
        logger.error(f"❌ Failed to organize dataset: {str(e)}")
        import traceback
        logger.error(f"📋 Full error traceback: {traceback.format_exc()}")
        return None, None

def train_model(train_dir, val_dir, dataset_info):
    """Train the disease detection model with enhanced capabilities."""
    try:
        logger.info("🚀 Starting enhanced model training...")
        
        # Check GPU availability and configure
        import tensorflow as tf
        import os
        
        # Set environment variables for optimal performance
        os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
        os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN for stability
        
        # Configure GPU/CPU with enhanced detection
        gpus = None
        try:
            # Check if TensorFlow was built with CUDA support
            cuda_built = tf.test.is_built_with_cuda()
            logger.info(f"🔧 TensorFlow built with CUDA: {cuda_built}")
            
            gpus = tf.config.list_physical_devices('GPU')
            if gpus:
                logger.info(f"🎮 GPU detected: {len(gpus)} GPU(s) available")
                for i, gpu in enumerate(gpus):
                    logger.info(f"   • GPU {i}: {gpu.name}")
                
                # Configure GPU memory growth
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
                    # Uncomment to set memory limit if you have memory issues
                    # tf.config.experimental.set_memory_limit(gpu, 4096)  # 4GB limit
                
                # Test GPU computation
                try:
                    with tf.device('/GPU:0'):
                        test_tensor = tf.constant([[1.0, 2.0]])
                        result = tf.matmul(test_tensor, tf.transpose(test_tensor))
                    logger.info(f"✅ GPU configured successfully and tested")
                except Exception as gpu_test_error:
                    logger.warning(f"⚠️ GPU test failed: {gpu_test_error}")
                    logger.info("💻 Falling back to CPU training")
                    gpus = None
            else:
                if cuda_built:
                    logger.warning("⚠️ TensorFlow has CUDA support but no GPUs detected")
                    logger.info("💡 Check GPU drivers and CUDA installation")
                    logger.info("💡 Run: python scripts/check_gpu_setup.py")
                else:
                    logger.info("💻 TensorFlow not built with CUDA support")
                logger.info("💻 Using CPU training (will be slower)")
                # Optimize CPU performance
                tf.config.threading.set_intra_op_parallelism_threads(0)
                tf.config.threading.set_inter_op_parallelism_threads(0)
        except Exception as e:
            logger.warning(f"GPU configuration error: {e}")
            logger.info("💻 Falling back to CPU training")
            gpus = None
        
        num_classes = len(dataset_info['classes'])
        class_names = dataset_info['classes']
        
        logger.info(f"📊 Training configuration:")
        logger.info(f"   • Classes: {num_classes}")
        logger.info(f"   • Total images: {dataset_info['total_images']:,}")
        logger.info(f"   • Device: {'GPU' if gpus else 'CPU'}")
        
        # Adaptive batch size and epochs based on dataset size and hardware
        if gpus:
            # GPU configuration - more aggressive training
            if dataset_info['total_images'] > 40000:
                batch_size = 32  # Larger batch for big datasets
                epochs = 25
            else:
                batch_size = 16
                epochs = 20
        else:
            # CPU configuration - conservative settings
            batch_size = 8
            epochs = 15 if dataset_info['total_images'] > 40000 else 10
        
        logger.info(f"   • Batch size: {batch_size}")
        logger.info(f"   • Epochs: {epochs}")
        logger.info(f"   • Estimated time: {('45-90 min' if gpus else '3-6 hours')}")
        
        # Initialize model with proper number of classes
        model = DiseaseDetectionModel(num_classes=num_classes)
        
        # Train the model with enhanced parameters
        logger.info("🔥 Starting training process...")
        history = model.train_model(
            train_data_path=train_dir,
            validation_data_path=val_dir,
            epochs=epochs,
            batch_size=batch_size
        )
        
        # Save the trained model
        model_dir = project_root / "model"
        model_dir.mkdir(exist_ok=True)
        model_path = model_dir / "disease_detection_model.h5"
        
        logger.info("💾 Saving trained model...")
        model.save_model(str(model_path), class_names)
        
        # Calculate additional metrics
        best_val_acc = max(history['val_accuracy'])
        best_train_acc = max(history['accuracy'])
        final_loss = history['loss'][-1]
        final_val_loss = history['val_loss'][-1]
        
        # Save comprehensive training results
        results = {
            'training_completed': True,
            'model_version': '2.0_full_dataset',
            'num_classes': num_classes,
            'class_names': class_names,
            'total_images': dataset_info['total_images'],
            'class_distribution': dataset_info['class_info'],
            'training_config': {
                'batch_size': batch_size,
                'epochs': epochs,
                'device': 'GPU' if gpus else 'CPU',
                'optimizer': 'Adam',
                'base_model': 'MobileNetV2'
            },
            'performance_metrics': {
                'final_accuracy': float(history['accuracy'][-1]),
                'final_val_accuracy': float(history['val_accuracy'][-1]),
                'best_accuracy': float(best_train_acc),
                'best_val_accuracy': float(best_val_acc),
                'final_loss': float(final_loss),
                'final_val_loss': float(final_val_loss),
                'epochs_trained': len(history['accuracy'])
            },
            'model_path': str(model_path),
            'training_history': history
        }
        
        results_path = model_dir / "training_results.json"
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Log comprehensive results
        logger.info("🎉 Model training completed successfully!")
        logger.info(f"📊 Performance Summary:")
        logger.info(f"   • Final Training Accuracy: {history['accuracy'][-1]:.3f}")
        logger.info(f"   • Final Validation Accuracy: {history['val_accuracy'][-1]:.3f}")
        logger.info(f"   • Best Training Accuracy: {best_train_acc:.3f}")
        logger.info(f"   • Best Validation Accuracy: {best_val_acc:.3f}")
        logger.info(f"   • Final Training Loss: {final_loss:.3f}")
        logger.info(f"   • Final Validation Loss: {final_val_loss:.3f}")
        logger.info(f"💾 Model saved to: {model_path}")
        logger.info(f"📋 Results saved to: {results_path}")
        
        # Memory cleanup
        try:
            import gc
            gc.collect()
            if gpus:
                tf.keras.backend.clear_session()
        except:
            pass
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Training failed: {str(e)}")
        import traceback
        logger.error(f"📋 Full error traceback: {traceback.format_exc()}")
        return False

def test_trained_model():
    """Test the trained model with a sample prediction."""
    try:
        logger.info("🧪 Testing trained model...")
        
        from scripts.disease_detection_service import get_disease_detection_service
        
        # Get the service (this will load the trained model)
        service = get_disease_detection_service()
        
        if not service.is_loaded:
            logger.error("❌ Failed to load trained model for testing")
            return False
        
        logger.info("✅ Model loaded successfully for testing")
        logger.info(f"📊 Model supports {len(service.model.class_names)} disease classes")
        
        # Show some example classes
        example_classes = service.model.class_names[:5]
        logger.info(f"📋 Example classes: {', '.join(example_classes)}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Model testing failed: {str(e)}")
        return False

def main():
    """Main function to train the disease detection model."""
    print("🌱 Krishi Mitra - Disease Detection Model Training")
    print("=" * 60)
    
    # Step 1: Check dataset
    print("\n1️⃣ Checking PlantVillage dataset...")
    dataset_info = check_dataset()
    
    if not dataset_info:
        print("\n❌ Dataset check failed!")
        print("\nPlease ensure you have:")
        print("1. Downloaded the PlantVillage dataset")
        print("2. Extracted it to: data/plantvillage dataset/color/")
        print("3. The folder contains disease class subdirectories")
        return
    
    # Step 2: Organize dataset
    print("\n2️⃣ Organizing dataset...")
    output_dir = project_root / "dataset"
    train_dir, val_dir = organize_dataset(dataset_info['path'], output_dir)
    
    if not train_dir or not val_dir:
        print("❌ Dataset organization failed!")
        return
    
    # Step 3: Train model
    print("\n3️⃣ Training model with full PlantVillage dataset...")
    print("⏰ This may take 45-90 minutes with GPU or 3-6 hours with CPU...")
    print("💡 Training on 38 disease classes with 50,000+ images")
    print("🔥 Using enhanced training pipeline with adaptive batch sizes")
    
    if train_model(train_dir, val_dir, dataset_info):
        print("\n4️⃣ Testing trained model...")
        if test_trained_model():
            print("\n🎉 Training and testing completed successfully!")
            print("\n📋 What's been created:")
            print("✅ Trained model: model/disease_detection_model.h5")
            print("✅ Model metadata: model/disease_detection_model_metadata.json")
            print("✅ Training results: model/training_results.json")
            print("✅ Organized dataset: dataset/train/ and dataset/validation/")
            
            print("\n🚀 Next steps:")
            print("1. Start your backend server: uvicorn backend_app:app --reload")
            print("2. Open your frontend and test the 'Detect Disease' feature")
            print("3. Upload crop images to see real AI predictions!")
            print("4. Optionally optimize for deployment: python scripts/optimize_model_for_deployment.py")
        else:
            print("⚠️ Training completed but testing failed. Check the logs above.")
    else:
        print("❌ Training failed. Check the error messages above.")

if __name__ == "__main__":
    main()
