import React from "react";
import { useTranslation } from "react-i18next";

const ImageInfoModal = ({ isVisible, setIsVisible, imageStats }) => {
  const { t } = useTranslation();
  
  if (!isVisible) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{t("Image Import Results")}</h3>
          <button
            className="close-button"
            onClick={() => setIsVisible(false)}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="image-import-container">
            <div className="image-import-message">
              {imageStats.totalProcessed > 0 ? (
                <>
                  <p>
                    <strong>{t("Processing Complete")}</strong>
                  </p>
                  <div className="image-import-count">
                    <p>
                      {t("Images with location data")}: <strong>{imageStats.withLocation}</strong> / {imageStats.totalProcessed}
                    </p>
                    {imageStats.withLocation === 0 && (
                      <p className="error-text">
                        {t("No images with location data were found. Please ensure your images have GPS coordinates in their metadata.")}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p>{t("No images were processed. Please try again.")}</p>
              )}
            </div>
            
            {imageStats.withLocation > 0 && (
              <p>
                {t("The images with location data have been added to the map. You can view and interact with them on the map.")}
              </p>
            )}
            
            <div className="image-import-info">
              <p>
                {t("Note: Only images with embedded GPS coordinates (EXIF data) can be displayed on the map.")}
              </p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="button-primary"
            onClick={() => setIsVisible(false)}
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageInfoModal;
