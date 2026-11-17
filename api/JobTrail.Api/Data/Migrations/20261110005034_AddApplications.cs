using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTrail.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "applications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    company = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    description = table.Column<string>(type: "character varying(100000)", maxLength: 100000, nullable: true),
                    salary_range = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    contact_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    contact_email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    resume_version = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    notes = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: true),
                    stage = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    applied_on = table.Column<DateOnly>(type: "date", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_applications", x => x.id);
                    table.ForeignKey(
                        name: "fk_applications_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "application_stage_changes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    application_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_stage = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    to_stage = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    changed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_application_stage_changes", x => x.id);
                    table.ForeignKey(
                        name: "fk_application_stage_changes_applications_application_id",
                        column: x => x.application_id,
                        principalTable: "applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_application_stage_changes_application_id",
                table: "application_stage_changes",
                column: "application_id");

            migrationBuilder.CreateIndex(
                name: "ix_applications_user_id_created_at",
                table: "applications",
                columns: new[] { "user_id", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "application_stage_changes");

            migrationBuilder.DropTable(
                name: "applications");
        }
    }
}
